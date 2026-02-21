import axios from 'axios';

const API_URL = '/api/news';

export const fetchNews = async ({ limit, offset } = {}) => {
  try {
    const params = {};
    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;

    const response = await axios.get(API_URL, { params });
    const total = response.headers['x-total-count'];

    return {
      items: response.data,
      total: total ? parseInt(total, 10) : 0
    };
  } catch (error) {
    console.error('Error fetching news:', error);
    return { items: [], total: 0 };
  }
};

export const getNewsById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching news details:', error);
    return null;
  }
};
