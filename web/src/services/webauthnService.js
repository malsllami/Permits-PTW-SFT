import { callApi } from './apiClient.js';
import { WEBAUTHN_CREDENTIAL_STORAGE_KEY } from '../config/apiConfig.js';

function base64UrlToBuffer(base64url) {
  const padded = base64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(base64url.length / 4) * 4, '=');
  const binary = atob(padded);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
  return buffer.buffer;
}

function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function getLocalCredentialId(employeeId) {
  const raw = localStorage.getItem(WEBAUTHN_CREDENTIAL_STORAGE_KEY);
  if (!raw) return null;
  try {
    const map = JSON.parse(raw);
    return map[employeeId] || null;
  } catch (e) {
    return null;
  }
}

function setLocalCredentialId(employeeId, credentialId) {
  const raw = localStorage.getItem(WEBAUTHN_CREDENTIAL_STORAGE_KEY);
  let map = {};
  try { map = raw ? JSON.parse(raw) : {}; } catch (e) { map = {}; }
  map[employeeId] = credentialId;
  localStorage.setItem(WEBAUTHN_CREDENTIAL_STORAGE_KEY, JSON.stringify(map));
}

export function hasLocalWebAuthnCredential(employeeId) {
  return !!getLocalCredentialId(employeeId);
}

/** دورة تسجيل بصمة جهاز جديدة (أول مرة على هذا الجهاز). */
export async function registerDeviceBiometric(employeeId, deviceName) {
  if (!window.PublicKeyCredential) {
    throw new Error('هذا الجهاز/المتصفح لا يدعم المصادقة البيومترية (WebAuthn).');
  }
  const options = await callApi('getRegistrationOptions', {});

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: base64UrlToBuffer(options.challenge),
      rp: { id: options.rpId, name: options.rpName },
      user: {
        id: base64UrlToBuffer(options.userId),
        name: options.userName,
        displayName: options.userDisplayName
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 }
      ],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
      timeout: 60000,
      attestation: 'none'
    }
  });

  const credentialId = bufferToBase64Url(credential.rawId);
  const clientDataJSON = arrayBufferToBase64Plain_(credential.response.clientDataJSON);

  await callApi('verifyRegistration', {
    credentialResponse: { credentialId: credentialId, clientDataJSON: clientDataJSON, publicKey: '' },
    deviceName: deviceName || (navigator.platform || 'جهاز غير مسمّى')
  });

  setLocalCredentialId(employeeId, credentialId);
  return true;
}

/** دورة مصادقة لجهاز سبق تسجيله. */
export async function authenticateDeviceBiometric(employeeId) {
  if (!window.PublicKeyCredential) {
    throw new Error('هذا الجهاز/المتصفح لا يدعم المصادقة البيومترية (WebAuthn).');
  }
  const options = await callApi('getAuthenticationOptions', {});
  const localCredentialId = getLocalCredentialId(employeeId);

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: base64UrlToBuffer(options.challenge),
      rpId: options.rpId,
      allowCredentials: (options.allowCredentialIds || []).map((id) => ({
        type: 'public-key',
        id: base64UrlToBuffer(id)
      })),
      userVerification: 'required',
      timeout: 60000
    }
  });

  const credentialId = bufferToBase64Url(assertion.rawId);
  const clientDataJSON = arrayBufferToBase64Plain_(assertion.response.clientDataJSON);

  await callApi('verifyAuthentication', {
    assertionResponse: { credentialId: credentialId, clientDataJSON: clientDataJSON }
  });

  if (!localCredentialId) setLocalCredentialId(employeeId, credentialId);
  return true;
}

function arrayBufferToBase64Plain_(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}
