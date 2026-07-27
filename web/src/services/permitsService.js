import { callApi } from './apiClient.js';

export const createPermit = (permitType, voltageLevel) => callApi('createPermit', { permitType, voltageLevel });

export const sendToReceiver = (creationId, formData, signature, gps, checkedMap) =>
  callApi('sendToReceiver', { creationId, formData, signature, gps, checkedMap });

export const saveSourceWorkData = (creationId, formData) =>
  callApi('saveSourceWorkData', { creationId, formData });

export const saveReceiverSection = (creationId, formData, signature, gps, checkedMap) =>
  callApi('saveReceiverSection', { creationId, formData, signature, gps, checkedMap });

export const approveBySource = (creationId, signature, gps) =>
  callApi('approveBySource', { creationId, signature, gps });

export const closeOrCancelByReceiver = (creationId, action, signature, gps, reason, checkedMap) =>
  callApi('closeOrCancelByReceiver', { creationId, action, signature, gps, reason, checkedMap });

export const initiateReceiverHandover = (creationId, newReceiverEmployeeId, signature, gps) =>
  callApi('initiateReceiverHandover', { creationId, newReceiverEmployeeId, signature, gps });

export const confirmReceiverHandover = (transferId, signature, gps) =>
  callApi('confirmReceiverHandover', { transferId, signature, gps });

export const closeBySource = (creationId, signature, gps, checkedMap) =>
  callApi('closeBySource', { creationId, signature, gps, checkedMap });

export const searchPermits = (filters) => callApi('searchPermits', { filters });

export const listMyOperations = () => callApi('listMyOperations', {});

export const getSecretCodeForSource = (creationId) => callApi('getSecretCodeForSource', { creationId });

export const getFullPermitView = (creationId) => callApi('getFullPermitView', { creationId });

export const resolveAccessForPermitLink = (employeeId, creationId, programNumber, secretCode) =>
  callApi('resolveAccessForPermitLink', { employeeId, creationId, programNumber, secretCode });

export const reopenPermit = (creationId) => callApi('reopenPermit', { creationId });

export const cancelPermitByAdmin = (creationId, reason) => callApi('cancelPermitByAdmin', { creationId, reason });

export const manualArchiveByAdmin = (creationId, reason) => callApi('manualArchiveByAdmin', { creationId, reason });

export const restoreFromTrash = (deletionId) => callApi('restoreFromTrash', { deletionId });
