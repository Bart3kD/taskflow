<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let newPassword = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let loading = $state(false);
	let error = $state('');

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		error = '';

		if (newPassword !== confirmPassword) {
			error = 'Passwords do not match.';
			return;
		}

		loading = true;

		const res = await fetch('/api/auth/reset-password', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token: data.token, newPassword })
		});

		loading = false;

		if (res.ok) {
			goto('/login?reset=1');
		} else {
			const body = await res.json().catch(() => null);
			error = body?.message ?? 'Something went wrong. Please request a new reset link.';
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-background">
	<div class="w-full max-w-sm space-y-6">
		<div class="text-center">
			<h1 class="text-[1.5rem] font-bold tracking-tight">TaskFlow</h1>
			<p class="mt-1 text-[0.875rem] text-muted-foreground">Set a new password</p>
		</div>

		<form onsubmit={submit} class="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
			<p class="text-[0.8125rem] text-muted-foreground">
				Setting a new password for <strong class="text-foreground">{data.name}</strong>.
			</p>

			<div class="space-y-1.5">
				<Label for="new-password">New password</Label>
				<Input
					id="new-password"
					type={showPassword ? 'text' : 'password'}
					placeholder="At least 8 characters"
					bind:value={newPassword}
					autocomplete="new-password"
					required
					minlength={8}
				/>
			</div>

			<div class="space-y-1.5">
				<Label for="confirm-password">Confirm password</Label>
				<Input
					id="confirm-password"
					type={showPassword ? 'text' : 'password'}
					placeholder="Repeat your password"
					bind:value={confirmPassword}
					autocomplete="new-password"
					required
				/>
			</div>

			<label class="flex items-center gap-2 cursor-pointer select-none w-fit">
				<input type="checkbox" bind:checked={showPassword} class="size-3.5 rounded" />
				<span class="text-[0.8125rem] text-muted-foreground">Show passwords</span>
			</label>

			{#if error}
				<p class="text-[0.8125rem] text-destructive">{error}</p>
			{/if}

			<Button type="submit" class="w-full" disabled={loading || !newPassword || !confirmPassword}>
				{loading ? 'Saving…' : 'Set new password'}
			</Button>
		</form>

		<p class="text-center text-[0.8125rem] text-muted-foreground">
			<a href="/login" class="text-primary hover:underline">← Back to sign in</a>
		</p>
	</div>
</div>
