// Re-export de compatibilidade.
// A partir da aula 3.2 o arquivo canônico de tipos do banco é `supabase.ts`
// (gerado com `supabase gen types typescript --linked > src/types/supabase.ts`).
// Este shim mantém válidos imports antigos de `@/types/database.types`.
export type { Database, Json, Tables, TablesInsert, TablesUpdate } from "./supabase";
