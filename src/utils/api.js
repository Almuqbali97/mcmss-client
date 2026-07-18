import axios from 'axios';
import { API_BASE_URL } from './apiConfig.js';

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

// Handle 401 - attempt token refresh before redirecting to login
const authEndpoints = ['/auth/login', '/auth/signup', '/auth/verify-signup', '/auth/forgot-password', '/auth/reset-password', '/auth/resend-signup-otp', '/auth/refresh-token'];

let isRefreshing = false;
let refreshQueue = [];

const clearSession = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

const processRefreshQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    const isAuthRequest = authEndpoints.some((path) => originalRequest.url?.includes(path));
    if (isAuthRequest) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      clearSession();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) {
      clearSession();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
        refreshToken: storedRefreshToken,
      });
      const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      processRefreshQueue(null, accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processRefreshQueue(refreshError, null);
      clearSession();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
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
  if (data.status !== undefined) fd.append('status', data.status);
  const formData = data.formData || data;
  const sanitized = { ...formData };
  const fileFields = [
    'informationSheetFiles',
    'consentFormFiles',
    'grantDocuments',
    'ethicsApprovalDocuments',
    'bloodTissueAbroadDocuments',
  ];
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

export const deleteSubmission = async (id) => {
  await api.delete(`/submissions/${id}`);
};

export const assignReviewer = async (id, reviewerId) => {
  const response = await api.post(`/submissions/${id}/assign-reviewer`, { reviewerId });
  return getData(response);
};

export const submitReview = async (id, status, comments) => {
  const response = await api.post(`/submissions/${id}/review`, { status, comments });
  return getData(response);
};

export const setPiDeclaration = async (id, decision) => {
  const response = await api.post(`/submissions/${id}/pi-declaration`, { decision });
  return getData(response);
};

export const updateFieldComments = async (id, fieldComments) => {
  const response = await api.patch(`/submissions/${id}/field-comments`, { fieldComments });
  return getData(response);
};

export const uploadApprovalCertificate = async (id, file) => {
  const fd = new FormData();
  fd.append('approvalCertificate', file);
  const response = await api.post(`/submissions/${id}/approval-certificate`, fd);
  return getData(response);
};

export const getAssignedSubmissions = async () => {
  const response = await api.get('/submissions/assigned');
  return getData(response);
};

export const getReviewers = async () => {
  const response = await api.get('/reviewers');
  return getData(response);
};

export const getReviewerCandidates = async () => {
  const response = await api.get('/reviewers/candidates');
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

const PF_FILE_FIELDS = [
  'frontPageOrArticleFiles',
  'proofOfPaymentFiles',
  'acceptanceLetterFiles',
  'publishedArticleFiles',
  'invoiceReceiptFiles',
  'irbApprovalFiles',
  'copeDoajProofFiles',
  'additionalSupportingFiles',
];

const buildPublicationFundingFormData = (data) => {
  const fd = new FormData();
  fd.append('manuscriptTitle', data.manuscriptTitle || '');
  fd.append('applicantName', data.applicantName || '');
  fd.append('status', data.status || 'draft');
  const formData = data.formData || data;
  const sanitized = { ...formData };
  for (const field of PF_FILE_FIELDS) {
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

export const getPublicationFundingApplications = async (status) => {
  const response = await api.get('/publication-funding', status ? { params: { status } } : {});
  return getData(response);
};

export const getPublicationFunding = async (id) => {
  const response = await api.get(`/publication-funding/${id}`);
  return getData(response);
};

export const createPublicationFunding = async (data) => {
  const payload = typeof data.formData !== 'undefined' ? { ...data, formData: data.formData } : data;
  const hasFiles = hasFileObjects(payload.formData || payload);
  if (hasFiles) {
    const formData = buildPublicationFundingFormData(payload);
    const response = await api.post('/publication-funding', formData);
    return getData(response);
  }
  const response = await api.post('/publication-funding', payload);
  return getData(response);
};

export const updatePublicationFunding = async (id, data) => {
  const payload = typeof data.formData !== 'undefined' ? { ...data, formData: data.formData } : data;
  const hasFiles = hasFileObjects(payload.formData || payload);
  if (hasFiles) {
    const formData = buildPublicationFundingFormData(payload);
    const response = await api.put(`/publication-funding/${id}`, formData);
    return getData(response);
  }
  const response = await api.put(`/publication-funding/${id}`, payload);
  return getData(response);
};

export const submitPublicationFundingForReview = async (id) => {
  const response = await api.post(`/publication-funding/${id}/submit`);
  return getData(response);
};

export const deletePublicationFunding = async (id) => {
  await api.delete(`/publication-funding/${id}`);
};

export const submitPublicationFundingReview = async (id, status, comments) => {
  const response = await api.post(`/publication-funding/${id}/review`, { status, comments });
  return getData(response);
};

export const updateCommitteeReview = async (id, committeeReview) => {
  const response = await api.patch(`/publication-funding/${id}/committee-review`, { committeeReview });
  return getData(response);
};

export const exportPublicationFunding = async (id) => {
  const response = await api.get(`/publication-funding/${id}/export`, { responseType: 'json' });
  return getData(response);
};

export const getAdminUsers = async () => {
  const response = await api.get('/settings/admins');
  return getData(response);
};

export const getNotificationSettings = async () => {
  const response = await api.get('/settings/notifications');
  return getData(response);
};

export const updateNotificationSettings = async (submissionNotificationRecipient) => {
  const response = await api.put('/settings/notifications', { submissionNotificationRecipient });
  return getData(response);
};
