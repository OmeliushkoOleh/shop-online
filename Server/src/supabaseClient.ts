import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// Для сервера используем SECRET_KEY, чтобы иметь полный доступ к таблицам
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error("Проверьте файл .env: отсутствуют ключи Supabase!");
}

// Создаем и экспортируем клиент базы данных
export const supabase = createClient(supabaseUrl, supabaseSecretKey);
