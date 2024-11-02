// app/api/categories/[id]/route.js
export async function GET(request, { params }) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        products: true,
        parent: {
          select: { id: true, name: true }
        },
        children: {
          select: { id: true, name: true }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Category GET by ID Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// Custom hook for categories
// hooks/useCategories.js
import { useState, useCallback } from 'react';
import axios from 'axios';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async (search = '', page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/categories', {
        params: { search, page, limit }
      });
      setCategories(response.data.categories);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (categoryData) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/categories', categoryData);
      setCategories(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory
  };
}