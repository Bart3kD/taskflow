<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	const justReset = $derived($page.url.searchParams.get('reset') === '1');

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		error = '';

		const res = await fetch('/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password })
		});

		loading = false;

		if (res.ok) {
			goto('/dashboard');
		} else {
			error = 'Invalid email or password.';
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-background">
	<div class="w-full max-w-sm space-y-6">
		<div class="text-center">
			<h1 class="text-[1.5rem] font-bold tracking-tight">TaskFlow</h1>
			<p class="mt-1 text-[0.875rem] text-muted-foreground">Sign in to your account</p>
		</div>

		<form onsubmit={submit} class="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
			{#if justReset}
				<p class="text-[0.8125rem] text-[var(--color-status-green)] rounded-lg bg-green-500/10 px-3 py-2">
					Password updated — you can now sign in with your new password.
				</p>
			{/if}

			<div class="space-y-1.5">
				<Label for="email">Email</Label>
				<Input id="email" type="email" bind:value={email} placeholder="admin@taskflow.app" required />
			</div>

			<div class="space-y-1.5">
				<div class="flex items-center justify-between">
					<Label for="password">Password</Label>
					<a href="/forgot-password" class="text-[0.75rem] text-muted-foreground hover:text-foreground transition-colors">
						Forgot password?
					</a>
				</div>
				<Input id="password" type="password" bind:value={password} required />
			</div>

			{#if error}
				<p class="text-[0.875rem] text-destructive">{error}</p>
			{/if}

			<Button type="submit" class="w-full" disabled={loading}>
				{loading ? 'Signing in…' : 'Sign in'}
			</Button>
		</form>
	</div>
</div>
