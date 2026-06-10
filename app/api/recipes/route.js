import { turso } from '@/lib/turso';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await turso.execute(
      'SELECT * FROM recipes ORDER BY created_at DESC'
    );

    const recipes = result.rows.map(row => ({
      ...row,
      ingredients: JSON.parse(row.ingredients),
    }));

    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Error loading recipes:', error);
    return NextResponse.json({ error: 'Failed to load recipes' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, cuisine, meal_type, cook_time, ingredients, source } = body;

    await turso.execute({
      sql: 'INSERT INTO recipes (name, cuisine, meal_type, cook_time, ingredients, source) VALUES (?, ?, ?, ?, ?, ?)',
      args: [
        name,
        cuisine,
        meal_type,
        cook_time,
        JSON.stringify(ingredients),
        source,
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding recipe:', error);
    return NextResponse.json({ error: 'Failed to add recipe' }, { status: 500 });
  }
}
