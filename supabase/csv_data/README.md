# Importing Scheme Data into Supabase

This directory contains CSV files used to seed the `schemes` table in your Supabase database. The project includes a dedicated script to handle this import process.

## Available Data

| CSV File | Description |
| :--- | :--- |
| `farmers_schemes_supabase.csv` | Scheme data specifically for farmers. |
| `students_schemes_supabase.csv` | Scheme data specifically for students. |

> [!NOTE]
> The `setup.sql` file in the parent `supabase` directory contains seed data for other tables like `documents`, `faqs`, `helplines`, etc. The CSV files here are only for the `schemes` table.

---

## How to Import Scheme Data

The recommended way to import the scheme data from the CSV files is to use the provided Node.js script. This ensures data is correctly parsed and upserted into your Supabase instance.

### Steps:

1.  **Configure Environment:** Make sure your `.env` file in the project root is correctly set up with your `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

2.  **Run the Script:** From the project's root directory (`Digitalized-Citizen-Awareness-Portal-main`), run the following command in your terminal:

    ```bash
    node server/utils/importData.js
    ```

3.  **Verify:** The script will log its progress. Once it's finished, you can check the `schemes` table in your Supabase dashboard to see the imported data. The script uses an `upsert` operation, so it's safe to run multiple times.
