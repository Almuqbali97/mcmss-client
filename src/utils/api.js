import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Handle 401 - token expired (only redirect for protected routes, not auth endpoints)
const authEndpoints = ['/auth/login', '/auth/signup', '/auth/verify-signup', '/auth/forgot-password', '/auth/reset-password', '/auth/resend-signup-otp'];
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRequest = authEndpoints.some((path) =>
        error.config?.url?.includes(path)
      );
      if (!isAuthRequest) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const getData = (res) => (res.data?.data !== undefined ? res.data.data : res.data);

const hasFileObjects = (obj) => {
  if (obj instanceof File) return true;
  if (Array.isArray(obj)) return obj.some(hasFileObjects);
  if (obj && typeof obj === 'object') return Object.values(obj).some(hasFileObjects);
  return false;
};

const buildSubmissionFormData = (data) => {
  const fd = new FormData();
  fd.append('researchTitle', data.researchTitle || '');
  fd.append('principalInvestigator', data.principalInvestigator || '');
  fd.append('status', data.status || 'draft');
  const formData = data.formData || data;
  const sanitized = { ...formData };
  const fileFields = ['informationSheetFiles', 'consentFormFiles', 'grantDocuments', 'sampleSizeFiles', 'dataVariablesFiles', 'researchProposalFiles'];
  for (const field of fileFields) {
    if (Array.isArray(sanitized[field])) {
      const files = sanitized[field].filter((f) => f instanceof File);
      const existing = sanitized[field].filter((f) => !(f instanceof File));
      sanitized[field] = existing;
      for (const file of files) {
        fd.append(field, file);
      }
    }
  }
  fd.append('formDataJson', JSON.stringify(sanitized));
  return fd;
};

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const { user, accessToken, refreshToken } = response.data.data;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
  return { success: true, user: { ...user, id: user.id || user._id } };
};

export const signupStep1 = async (firstName, lastName, email, password) => {
  const response = await api.post('/auth/signup', { firstName, lastName, email, password });
  return response.data;
};

export const verifySignup = async (email, otp) => {
  const response = await api.post('/auth/verify-signup', { email, otp });
  const { user, accessToken, refreshToken } = response.data.data;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
  return response.data;
};

export const resendSignupOTP = async (email) => {
  const response = await api.post('/auth/resend-signup-otp', { email });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await api.post('/auth/reset-password', { token, newPassword });
  return response.data;
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return getData(response);
};

export const changePassword = async (currentPassword, newPassword) => {
  await api.post('/auth/change-password', { currentPassword, newPassword });
};

export const getSubmissions = async (status) => {
  const response = await api.get('/submissions', status ? { params: { status } } : {});
  return getData(response);
};

export const getSubmission = async (id) => {
  const response = await api.get(`/submissions/${id}`);
  return getData(response);
};

export const createSubmission = async (data) => {
  const payload = typeof data.formData !== 'undefined' ? { ...data, formData: data.formData } : data;
  const hasFiles = hasFileObjects(payload.formData || payload);
  if (hasFiles) {
    const formData = buildSubmissionFormData(payload);
    const response = await api.post('/submissions', formData);
    return getData(response);
  }
  const response = await api.post('/submissions', payload);
  return getData(response);
};

export const updateSubmission = async (id, data) => {
  const payload = typeof data.formData !== 'undefined' ? { ...data, formData: data.formData } : data;
  const hasFiles = hasFileObjects(payload.formData || payload);
  if (hasFiles) {
    const formData = buildSubmissionFormData(payload);
    const response = await api.put(`/submissions/${id}`, formData);
    return getData(response);
  }
  const response = await api.put(`/submissions/${id}`, payload);
  return getData(response);
};

export const submitForReview = async (id) => {
  const response = await api.post(`/submissions/${id}/submit`);
  return getData(response);
};

export const assignReviewer = async (id, reviewerId) => {
  const response = await api.post(`/submissions/${id}/assign-reviewer`, { reviewerId });
  return getData(response);
};

export const submitReview = async (id, status, comments) => {
  const response = await api.post(`/submissions/${id}/review`, { status, comments });
  return getData(response);
};

export const updateFieldComments = async (id, fieldComments) => {
  const response = await api.patch(`/submissions/${id}/field-comments`, { fieldComments });
  return getData(response);
};

export const getReviewers = async () => {
  const response = await api.get('/reviewers');
  return getData(response);
};

export const getReviewer = async (id) => {
  const response = await api.get(`/reviewers/${id}`);
  return getData(response);
};

export const createReviewer = async (data) => {
  const response = await api.post('/reviewers', data);
  return getData(response);
};

export const updateReviewer = async (id, data) => {
  const response = await api.put(`/reviewers/${id}`, data);
  return getData(response);
};

export const deleteReviewer = async (id) => {
  await api.delete(`/reviewers/${id}`);
};

export const exportSubmission = async (id) => {
  const response = await api.get(`/submissions/${id}/export`, { responseType: 'json' });
  return getData(response);
};
