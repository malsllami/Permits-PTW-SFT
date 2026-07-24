import { callApi } from './apiClient.js';

export const createPermit = (permitType, voltageLevel) => callApi('createPermit', { permitType, voltageLevel });

export const sendToReceiver = (creationId, formData, signature, gps) =>
  callApi('sendToReceiver', { creationId, formData, signature, gps });

export const saveReceiverSection = (creationId, formData, signature, gps) =>
  callApi('saveReceiverSection', { creationId, formData, signature, gps });

export const approveBySource = (creationId, signature, gps) =>
  callApi('approveBySource', { creationId, signature, gps });

export const closeOrCancelByReceiver = (creationId, action, signature, gps) =>
  callApi('closeOrCancelByReceiver', { creationId, action, signature, gps });

export const closeBySource = (creationId, signature, gps) =>
  callApi('closeBySource', { creationId, signature, gps });

export const searchPermits = (filters) => callApi('searchPermits', { filters });

export const getFullPermitView = (creationId) => callApi('getFullPermitView', { creationId });

export const resolveAccessForPermitLink = (employeeId, creationId) =>
  callApi('resolveAccessForPermitLink', { employeeId, creationId });

export const reopenPermit = (creationId) => callApi('reopenPermit', { creationId });

export const cancelPermitByAdmin = (creationId, reason) => callApi('cancelPermitByAdmin', { creationId, reason });

export const manualArchiveByAdmin = (creationId, reason) => callApi('manualArchiveByAdmin', { creationId, reason });

export const restoreFromTrash = (deletionId) => callApi('restoreFromTrash', { deletionId });
