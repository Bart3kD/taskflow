import { SignJWT, jwtVerify } from 'jose';
import type { RequestEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { JWT_SECRET } from '$lib/env';

type TokenPayload = {
	userId: string;
	role: 'admin' | 'member';
};

function getSecret(): Uint8Array {
	return new TextEncoder().encode(JWT_SECRET);
}

export async function signToken(payload: TokenPayload): Promise<string> {
	return new SignJWT({ ...payload })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('7d')
		.sign(getSecret());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
	try {
		const { payload } = await jwtVerify(token, getSecret());
		return payload as unknown as TokenPayload;
	} catch {
		return null;
	}
}

export async function requireAuth(event: RequestEvent): Promise<TokenPayload> {
	const token = event.cookies.get('session');
	if (!token) throw error(401, 'Unauthorized');

	const payload = await verifyToken(token);
	if (!payload) throw error(401, 'Invalid or expired session');

	return payload;
}

export async function requireAdmin(event: RequestEvent): Promise<TokenPayload> {
	const payload = await requireAuth(event);
	if (payload.role !== 'admin') throw error(403, 'Forbidden');
	return payload;
}
