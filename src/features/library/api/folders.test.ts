import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Folders API tests. Mockujemy wyłącznie zewnętrzną granicę `@/lib/supabase`.
 * Testujemy: wywołanie query, kształt zwrotki, propagacja błędów, RLS isolation,
 * mutacje CRUD + assignVideoToFolders.
 *
 * Wzorzec mockowania: mockFromFolders zwraca NOWY builder per call (nie globalny
 * singleton), żeby testy były izolowane i nie dzieliły stanu.
 */

/** Fluent query builder — wszystkie metody mockowane, chainable. */
type MockBuilder = {
  select: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};

function makeBuilder(): MockBuilder {
  const builder: MockBuilder = {
    select: vi.fn(),
    order: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    single: vi.fn(),
  };
  builder.select.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.insert.mockReturnValue(builder);
  builder.update.mockReturnValue(builder);
  builder.delete.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.in.mockReturnValue(builder);
  builder.single.mockReturnValue(builder);
  return builder;
}

const { mockFrom, mockGetSession } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetSession: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: { getSession: mockGetSession },
  },
}));

import {
  assignVideoToFolders,
  createFolder,
  deleteFolder,
  getFolders,
  getVideoFolderIds,
  removeVideoFromFolder,
  updateFolder,
} from './folders';

const FAKE_FOLDER_A = {
  id: 'f-1',
  user_id: 'user-a',
  name: 'Bachata sensual',
  created_at: '2026-05-01T10:00:00Z',
  updated_at: '2026-05-01T10:00:00Z',
};

const FAKE_FOLDER_B = {
  id: 'f-2',
  user_id: 'user-a',
  name: 'Footwork',
  created_at: '2026-05-02T10:00:00Z',
  updated_at: '2026-05-02T10:00:00Z',
};

describe('getFolders', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  it('zwraca foldery usera sortowane name ASC', async () => {
    const builder = makeBuilder();
    mockFrom.mockReturnValue(builder);
    builder.order.mockResolvedValue({
      data: [FAKE_FOLDER_A, FAKE_FOLDER_B],
      error: null,
    });

    const result = await getFolders();

    expect(mockFrom).toHaveBeenCalledWith('folders');
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe('Bachata sensual');
    expect(result[1]?.name).toBe('Footwork');
  });

  it('zwraca pustą tablicę gdy user nie ma folderów', async () => {
    const builder = makeBuilder();
    mockFrom.mockReturnValue(builder);
    builder.order.mockResolvedValue({ data: [], error: null });

    const result = await getFolders();
    expect(result).toEqual([]);
  });

  it('rzuca Error gdy Supabase zwróci błąd', async () => {
    const builder = makeBuilder();
    mockFrom.mockReturnValue(builder);
    builder.order.mockResolvedValue({
      data: null,
      error: { message: 'permission denied' },
    });

    await expect(getFolders()).rejects.toThrow('permission denied');
  });

  it('RLS: zwraca 0 rows gdy user_id nie pasuje (mock izolacji)', async () => {
    const builder = makeBuilder();
    mockFrom.mockReturnValue(builder);
    builder.order.mockResolvedValue({ data: [], error: null });

    const result = await getFolders();
    expect(result).toHaveLength(0);
  });
});

describe('createFolder', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  it('zwraca nowy folder z id po udanym INSERT', async () => {
    const builder = makeBuilder();
    mockFrom.mockReturnValue(builder);
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-a' } } },
    });
    builder.single.mockResolvedValue({ data: FAKE_FOLDER_A, error: null });

    const result = await createFolder('Bachata sensual');

    expect(mockFrom).toHaveBeenCalledWith('folders');
    // user_id pochodzi z getSession() (cache-first) — kolumna NOT NULL wymaga jawnego value
    expect(builder.insert).toHaveBeenCalledWith({
      name: 'Bachata sensual',
      user_id: 'user-a',
    });
    expect(result.id).toBe('f-1');
    expect(result.name).toBe('Bachata sensual');
  });

  it('rzuca Error z kodem 23505 dla duplikatu nazwy (unique constraint)', async () => {
    const builder = makeBuilder();
    mockFrom.mockReturnValue(builder);
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-a' } } },
    });
    builder.single.mockResolvedValue({
      data: null,
      error: {
        code: '23505',
        message: 'duplicate key value violates unique constraint',
      },
    });

    // throwIfError preserves .code — sprawdzamy kod (nie message) per §P2-arch-4
    await expect(createFolder('Bachata sensual')).rejects.toMatchObject({
      code: '23505',
    });
  });

  it('rzuca Error gdy Supabase zwróci data: null bez błędu', async () => {
    const builder = makeBuilder();
    mockFrom.mockReturnValue(builder);
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-a' } } },
    });
    builder.single.mockResolvedValue({ data: null, error: null });

    await expect(createFolder('Test')).rejects.toThrow(
      'Nie udało się utworzyć folderu.',
    );
  });

  it('duplikat case-insensitive — rzuca constraint error (23505)', async () => {
    const builder = makeBuilder();
    mockFrom.mockReturnValue(builder);
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-a' } } },
    });
    builder.single.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'unique constraint violation' },
    });

    // "zajęcia" po "Zajęcia" → unique index na (user_id, lower(name)) zwraca 23505
    await expect(createFolder('zajęcia')).rejects.toMatchObject({
      code: '23505',
    });
  });

  it('rzuca Error gdy brak aktywnej sesji (niezalogowany user)', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    await expect(createFolder('Test')).rejects.toThrow('Not authenticated');
  });

  it('RLS: niezalogowany user → Supabase zwraca błąd RLS (fallback gdy session istnieje)', async () => {
    const builder = makeBuilder();
    mockFrom.mockReturnValue(builder);
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-a' } } },
    });
    builder.single.mockResolvedValue({
      data: null,
      error: {
        code: '42501',
        message: 'new row violates row-level security policy',
      },
    });

    await expect(createFolder('Test')).rejects.toThrow('row-level security');
  });
});

describe('updateFolder', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  it('zwraca zaktualizowany folder po udanym UPDATE', async () => {
    const updated = { ...FAKE_FOLDER_A, name: 'Nowa nazwa' };
    const builder = makeBuilder();
    mockFrom.mockReturnValue(builder);
    builder.single.mockResolvedValue({ data: updated, error: null });

    const result = await updateFolder('f-1', 'Nowa nazwa');

    expect(builder.update).toHaveBeenCalledWith({ name: 'Nowa nazwa' });
    expect(result.name).toBe('Nowa nazwa');
  });

  it('rzuca Error przy błędzie Supabase', async () => {
    const builder = makeBuilder();
    mockFrom.mockReturnValue(builder);
    builder.single.mockResolvedValue({
      data: null,
      error: { message: 'Row not found' },
    });

    await expect(updateFolder('f-99', 'X')).rejects.toThrow('Row not found');
  });
});

describe('deleteFolder', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  it('wywołuje DELETE na tabeli folders z podanym id', async () => {
    const builder = makeBuilder();
    mockFrom.mockReturnValue(builder);
    builder.eq.mockResolvedValue({ error: null });

    await deleteFolder('f-1');

    expect(mockFrom).toHaveBeenCalledWith('folders');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'f-1');
  });

  it('rzuca Error gdy Supabase zwróci błąd', async () => {
    const builder = makeBuilder();
    mockFrom.mockReturnValue(builder);
    builder.eq.mockResolvedValue({ error: { message: 'delete failed' } });

    await expect(deleteFolder('f-1')).rejects.toThrow('delete failed');
  });

  it('RLS: brak dostępu → Supabase zwraca błąd (mock izolacji)', async () => {
    const builder = makeBuilder();
    mockFrom.mockReturnValue(builder);
    builder.eq.mockResolvedValue({
      error: { message: 'new row violates row-level security policy' },
    });

    await expect(deleteFolder('f-other-user')).rejects.toThrow(
      'row-level security',
    );
  });
});

describe('assignVideoToFolders', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  it('diff and apply — INSERT nowe foldery dla video', async () => {
    // Pierwsze wywołanie: getVideoFolderIds (video_folders)
    const builderVF = makeBuilder();
    // Drugie wywołanie: INSERT
    const builderInsert = makeBuilder();

    mockFrom.mockReturnValueOnce(builderVF).mockReturnValueOnce(builderInsert);

    // getVideoFolderIds zwraca puste → target [f1] = INSERT f1
    builderVF.eq.mockResolvedValue({ data: [], error: null });
    builderInsert.insert.mockResolvedValue({ error: null });

    await assignVideoToFolders('v-1', ['f-1']);

    expect(builderInsert.insert).toHaveBeenCalledWith([
      { video_id: 'v-1', folder_id: 'f-1' },
    ]);
  });

  it('diff and apply — DELETE usunięte powiązania', async () => {
    // getVideoFolderIds zwraca [f1, f2], target [f1] → DELETE f2
    const builderVF = makeBuilder();
    const builderDelete = makeBuilder();

    mockFrom.mockReturnValueOnce(builderVF).mockReturnValueOnce(builderDelete);

    builderVF.eq.mockResolvedValue({
      data: [{ folder_id: 'f-1' }, { folder_id: 'f-2' }],
      error: null,
    });
    builderDelete.in.mockResolvedValue({ error: null });

    await assignVideoToFolders('v-1', ['f-1']);

    expect(builderDelete.delete).toHaveBeenCalled();
    expect(builderDelete.in).toHaveBeenCalledWith('folder_id', ['f-2']);
  });

  it('idempotentne — re-assignment do tego samego folderu = no INSERT/DELETE', async () => {
    const builderVF = makeBuilder();
    mockFrom.mockReturnValueOnce(builderVF);

    // current = [f-1], target = [f-1] → diff = empty
    builderVF.eq.mockResolvedValue({
      data: [{ folder_id: 'f-1' }],
      error: null,
    });

    await assignVideoToFolders('v-1', ['f-1']);

    // mockFrom tylko raz (getVideoFolderIds) — brak INSERT/DELETE call
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });
});

describe('removeVideoFromFolder', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  it('happy path: wywołuje DELETE z eq(video_id) i eq(folder_id)', async () => {
    const builder = makeBuilder();
    mockFrom.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    // Drugie eq() jest terminalne — resolves
    builder.eq
      .mockReturnValueOnce(builder)
      .mockResolvedValueOnce({ error: null });

    await removeVideoFromFolder('v-1', 'f-1');

    expect(mockFrom).toHaveBeenCalledWith('video_folders');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('video_id', 'v-1');
    expect(builder.eq).toHaveBeenCalledWith('folder_id', 'f-1');
  });

  it('error path: rzuca Error gdy Supabase zwróci błąd', async () => {
    const builder = makeBuilder();
    mockFrom.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    builder.eq
      .mockReturnValueOnce(builder)
      .mockResolvedValueOnce({ error: { message: 'delete failed' } });

    await expect(removeVideoFromFolder('v-1', 'f-1')).rejects.toThrow(
      'delete failed',
    );
  });
});

describe('assignVideoToFolders — edge cases', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  it('targetFolderIds=[] przy currentIds=[f-1,f-2] → DELETE obu powiązań', async () => {
    // getVideoFolderIds zwraca [f-1, f-2], target [] → DELETE f-1 i f-2
    const builderVF = makeBuilder();
    const builderDelete = makeBuilder();

    mockFrom.mockReturnValueOnce(builderVF).mockReturnValueOnce(builderDelete);

    builderVF.eq.mockResolvedValue({
      data: [{ folder_id: 'f-1' }, { folder_id: 'f-2' }],
      error: null,
    });
    builderDelete.in.mockResolvedValue({ error: null });

    await assignVideoToFolders('v-1', []);

    expect(builderDelete.delete).toHaveBeenCalled();
    expect(builderDelete.in).toHaveBeenCalledWith('folder_id', ['f-1', 'f-2']);
    // Brak INSERT call
    expect(builderDelete.insert).not.toHaveBeenCalled();
  });
});

describe('getVideoFolderIds', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  it('zwraca listę folder_id dla danego video', async () => {
    const builder = makeBuilder();
    mockFrom.mockReturnValue(builder);
    // select() chains do builder, eq() resolves jako Promise (terminal call)
    builder.select.mockReturnValue(builder);
    builder.eq.mockResolvedValue({
      data: [{ folder_id: 'f-1' }, { folder_id: 'f-2' }],
      error: null,
    });

    const result = await getVideoFolderIds('v-1');

    expect(result).toEqual(['f-1', 'f-2']);
  });

  it('zwraca pustą tablicę gdy film nie jest w żadnym folderze', async () => {
    const builder = makeBuilder();
    mockFrom.mockReturnValue(builder);
    builder.select.mockReturnValue(builder);
    builder.eq.mockResolvedValue({ data: [], error: null });

    const result = await getVideoFolderIds('v-1');

    expect(result).toEqual([]);
  });
});
