import { NextRequest, NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const audience = searchParams.get('audience') || 'visiteur';

    const query = `
      SELECT c.id AS category_id, c.name AS category_name, f.id AS faq_id, f.question, f.response
      FROM category_faq c
      LEFT JOIN faq f ON f.category_id = c.id AND f.audience = ?
      ORDER BY c.name, f.question
    `;

    const [rows] = await db.execute(query, [audience]);

    // Group by category
    const categories = rows.reduce((acc: any[], row: any) => {
      let category = acc.find(cat => cat.category_id === row.category_id);
      if (!category) {
        category = {
          category_id: row.category_id,
          category_name: row.category_name,
          faqs: []
        };
        acc.push(category);
      }
      if (row.faq_id) {
        category.faqs.push({
          id: row.faq_id,
          question: row.question,
          response: row.response
        });
      }
      return acc;
    }, []);

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
