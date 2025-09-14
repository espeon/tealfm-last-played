interface HandleResolution {
  did: string;
  pdsUrl: string;
}

/**
 * Resolves an AT Protocol handle to DID and PDS URL
 */
export async function resolveHandle(handle: string): Promise<HandleResolution> {
  // Clean up the handle - remove @ prefix and ensure proper format
  const cleanHandle = handle.replace(/^@/, '').toLowerCase();

  // If it looks like a DID already, try to get PDS directly
  if (cleanHandle.startsWith('did:')) {
    const pdsUrl = await resolveDIDtoPDS(cleanHandle);
    return { did: cleanHandle, pdsUrl };
  }

  // First resolve handle to DID
  const did = await resolveHandleToDID(cleanHandle);

  // Then resolve DID to PDS
  const pdsUrl = await resolveDIDtoPDS(did);

  return { did, pdsUrl };
}

/**
 * Resolves a handle to a DID using the AT Protocol resolution method
 */
async function resolveHandleToDID(handle: string): Promise<string> {
  // Try well-known endpoint first
  try {
    const wellKnownUrl = `https://${handle}/.well-known/atproto-did`;
    const response = await fetch(wellKnownUrl);

    if (response.ok) {
      const did = (await response.text()).trim();
      if (did.startsWith('did:')) {
        return did;
      }
    }
  } catch (error) {
    console.log('Well-known resolution failed, trying DNS TXT record');
  }

  // Fall back to public resolver (bsky.social for now)
  try {
    const resolverUrl = `https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`;
    const response = await fetch(resolverUrl);

    if (!response.ok) {
      throw new Error(`Handle resolution failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.did) {
      throw new Error('Invalid response from handle resolver');
    }

    return data.did;
  } catch (error) {
    throw new Error(`Failed to resolve handle ${handle}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Resolves a DID to its PDS URL
 */
async function resolveDIDtoPDS(did: string): Promise<string> {
  try {
    // Query the PLC directory for DID document
    const plcUrl = `https://plc.directory/${did}`;
    const response = await fetch(plcUrl);

    if (!response.ok) {
      throw new Error(`DID resolution failed: ${response.status}`);
    }

    const didDoc = await response.json();

    // Look for the PDS service endpoint
    const pdsService = didDoc.service?.find((s: any) =>
      s.id === '#atproto_pds' || s.type === 'AtprotoPersonalDataServer'
    );

    if (!pdsService?.serviceEndpoint) {
      throw new Error('No PDS service found in DID document');
    }

    return pdsService.serviceEndpoint;
  } catch (error) {
    throw new Error(`Failed to resolve DID to PDS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates if a string looks like a valid AT Protocol handle
 */
export function isValidHandle(handle: string): boolean {
  const cleanHandle = handle.replace(/^@/, '');

  // DID format
  if (cleanHandle.startsWith('did:')) {
    return /^did:[a-z]+:[a-zA-Z0-9._:-]+$/.test(cleanHandle);
  }

  // Domain handle format
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(cleanHandle);
}
