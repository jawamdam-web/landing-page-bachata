import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Statyczna walidacja migracji 0002 (Docker niedostępny — brak żywej bazy do
 * `supabase db reset`). Asercje pokrywają security-critical invarianty
 * konwencji projektu (migracja 0001) i wymagania IU-4:
 *   - RLS włączone na profiles
 *   - policies używają (select auth.uid()), nie auth.uid()/auth.email()
 *   - trigger handle_new_user istnieje i jest SECURITY DEFINER + search_path=''
 *   - display_name fallback chain (full_name → name → email-part)
 *
 * To NIE zastępuje E2E na żywej bazie (deferred do sesji z Dockerem / review),
 * ale wyłapuje regresje w treści SQL na poziomie unit.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const rawSql = readFileSync(
  join(__dirname, '0002_profiles_and_trigger.sql'),
  'utf8',
).toLowerCase();

/**
 * Executable SQL bez komentarzy (`-- ...`). Asercje negatywne (NIE używaj
 * auth.email() / gołego auth.uid()) muszą działać na realnym kodzie — komentarze
 * opisowe wspominają te wzorce jako "czego nie robić", więc je usuwamy.
 */
const sql = rawSql
  .split('\n')
  .map((line) => line.replace(/--.*$/, ''))
  .join('\n');

describe('migracja 0002 — tabela profiles', () => {
  it('tworzy public.profiles z id jako FK do auth.users ON DELETE CASCADE', () => {
    expect(sql).toContain('create table public.profiles');
    expect(sql).toContain('references auth.users (id) on delete cascade');
  });

  it('display_name jest NOT NULL (zawsze wypełniany przez trigger)', () => {
    expect(sql).toMatch(/display_name\s+text\s+not null/);
  });

  it('ma kolumny created_at i updated_at z default now()', () => {
    expect(sql).toMatch(
      /created_at\s+timestamptz\s+not null\s+default now\(\)/,
    );
    expect(sql).toMatch(
      /updated_at\s+timestamptz\s+not null\s+default now\(\)/,
    );
  });
});

describe('migracja 0002 — RLS', () => {
  it('włącza ROW LEVEL SECURITY na profiles', () => {
    expect(sql).toContain(
      'alter table public.profiles enable row level security',
    );
  });

  it('policy SELECT i UPDATE używają (select auth.uid()) = id', () => {
    expect(sql).toContain('for select to authenticated');
    expect(sql).toContain('for update to authenticated');
    expect(sql).toMatch(/\(select auth\.uid\(\)\)\s*=\s*id/);
  });

  it('NIE używa gołego auth.uid() ani auth.email() w policies', () => {
    // auth.uid() musi zawsze być owinięte w subquery (select auth.uid())
    expect(sql).not.toMatch(/using\s*\(\s*auth\.uid\(\)/);
    expect(sql).not.toContain('auth.email()');
  });
});

describe('migracja 0002 — trigger handle_new_user', () => {
  it('definiuje funkcję public.handle_new_user jako SECURITY DEFINER', () => {
    expect(sql).toContain('function public.handle_new_user()');
    expect(sql).toContain('security definer');
  });

  it('SECURITY DEFINER fn ma set search_path = ʼʼ (ochrona przed hijackingiem)', () => {
    expect(sql).toMatch(/security definer\s+set search_path = ''/);
  });

  it('insertuje do public.profiles (fully-qualified) z fallbackiem display_name', () => {
    expect(sql).toContain('insert into public.profiles');
    expect(sql).toContain("meta ->> 'full_name'");
    expect(sql).toContain("meta ->> 'name'");
    expect(sql).toContain("split_part(coalesce(new.email, ''), '@', 1)");
  });

  it('ekstrahuje avatar_url z metadata (avatar_url lub picture)', () => {
    expect(sql).toContain("meta ->> 'avatar_url'");
    expect(sql).toContain("meta ->> 'picture'");
  });

  it('tworzy trigger on_auth_user_created AFTER INSERT na auth.users', () => {
    expect(sql).toContain('create trigger on_auth_user_created');
    expect(sql).toContain('after insert on auth.users');
    expect(sql).toContain('execute function public.handle_new_user()');
  });
});

describe('migracja 0002 — touch_updated_at', () => {
  it('definiuje trigger BEFORE UPDATE utrzymujący updated_at', () => {
    expect(sql).toContain('function public.touch_updated_at()');
    expect(sql).toContain('before update on public.profiles');
    expect(sql).toContain('new.updated_at := now()');
  });
});
