<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let email = $state('');
	let loading = $state(false);
	let sent = $state(false);
	let error = $state('');

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		error = '';

		await fetch('/api/auth/forgot-password', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email })
		});

		loading = false;
		sent = true;
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-background">
	<div class="w-full max-w-sm space-y-6">
		<div class="text-center">
			<h1 class="text-[1.5rem] font-bold tracking-tight">TaskFlow</h1>
			<p class="mt-1 text-[0.875rem] text-muted-foreground">Reset your password</p>
		</div>

		<div class="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
			{#if data.expired}
				<p class="text-[0.8125rem] text-destructive rounded-lg bg-destructive/10 px-3 py-2">
					Your reset link has expired. Request a new one below.
				</p>
			{/if}

			{#if sent}
				<div class="text-center space-y-3 py-2">
					<div class="size-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
						<svg class="size-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
							<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
						</svg>
					</div>
					<div>
						<p class="text-[0.9375rem] font-semibold">Check your inbox</p>
						<p class="text-[0.8125rem] text-muted-foreground mt-1">
							If an account exists for <strong>{email}</strong>, we've sent a reset link. It expires in 1 hour.
						</p>
					</div>
				</div>
			{:else}
				<form onsubmit={submit} class="space-y-4">
					<div class="space-y-1.5">
						<Label for="email">Email address</Label>
						<Input
							id="email"
							type="email"
							bind:value={email}
							placeholder="you@example.com"
							required
						/>
					</div>

					{#if error}
						<p class="text-[0.8125rem] text-destructive">{error}</p>
					{/if}

					<Button type="submit" class="w-full" disabled={loading}>
						{loading ? 'Sending…' : 'Send reset link'}
					</Button>
				</form>
			{/if}
		</div>

		<p class="text-center text-[0.8125rem] text-muted-foreground">
			<a href="/login" class="text-primary hover:underline">← Back to sign in</a>
		</p>
	</div>
</div>
