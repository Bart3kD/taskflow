import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { verifyToken } from '$lib/auth/jwt';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const token = cookies.get('session');
	if (token) {
		const payload = await verifyToken(token);
		if (payload) throw redirect(302, '/dashboard');
	}

	return { expired: url.searchParams.get('expired') === '1' };
};
