const BASE = '/api';

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function upload(path, formData, method = 'POST') {
  const res = await fetch(`${BASE}${path}`, { method, body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// Contacts
export const getContacts = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return req(`/contacts${qs ? `?${qs}` : ''}`);
};
export const getContact = (id) => req(`/contacts/${id}`);
export const createContact = (formData) => upload('/contacts', formData, 'POST');
export const updateContact = (id, formData) => {
  if (formData instanceof FormData) return upload(`/contacts/${id}`, formData, 'PUT');
  return req(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(formData) });
};
export const deleteContact = (id) => req(`/contacts/${id}`, { method: 'DELETE' });
export const generateMessages = (id) => req(`/contacts/${id}/generate-messages`, { method: 'POST' });
export const updateMessage = (contactId, type, content) =>
  req(`/contacts/${contactId}/messages/${type}`, { method: 'PUT', body: JSON.stringify({ content }) });
export const markMessageSent = (contactId, type) =>
  req(`/contacts/${contactId}/messages/${type}/mark-sent`, { method: 'POST' });
export const addResponseNote = (contactId, type, response_note, mark_replied) =>
  req(`/contacts/${contactId}/messages/${type}/response`, { method: 'PUT', body: JSON.stringify({ response_note, mark_replied }) });
export const updateContactStatus = (id, status) =>
  req(`/contacts/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });

// Events
export const getEvents = () => req('/events');
export const getEvent = (id) => req(`/events/${id}`);
export const createEvent = (data) => req('/events', { method: 'POST', body: JSON.stringify(data) });
export const updateEvent = (id, data) => req(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEvent = (id) => req(`/events/${id}`, { method: 'DELETE' });

// Analytics
export const getAnalytics = () => req('/analytics');

// Settings
export const getSettings = () => req('/settings');
export const updateSettings = (data) => req('/settings', { method: 'PUT', body: JSON.stringify(data) });
export const testEmail = () => req('/settings/test-email', { method: 'POST' });
export const sendDigest = () => req('/settings/send-digest', { method: 'POST' });
