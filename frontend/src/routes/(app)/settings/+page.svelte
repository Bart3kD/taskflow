<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';

	let { data }: { data: PageData } = $props();

	// Telegram
	let telegramChatId = $state(untrack(() => data.user.telegramChatId ?? ''));
	let telegramLoading = $state(false);
	let telegramError = $state('');
	let telegramSuccess = $state(false);

	// Password
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let passwordLoading = $state(false);
	let passwordError = $state('');
	let passwordSuccess = $state(false);

	async function saveTelegram(e: SubmitEvent) {
		e.preventDefault();
		telegramLoading = true;
		telegramError = '';
		telegramSuccess = false;

		const res = await fetch(`/api/users/${data.user.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ telegramChatId: telegramChatId || null })
		});

		telegramLoading = false;
		if (res.ok) {
			telegramSuccess = true;
			await invalidateAll();
		} else {
			telegramError = 'Failed to save.';
		}
	}

	async function changePassword(e: SubmitEvent) {
		e.preventDefault();
		passwordError = '';
		passwordSuccess = false;

		if (newPassword !== confirmPassword) {
			passwordError = 'New passwords do not match.';
			return;
		}

		passwordLoading = true;

		const res = await fetch(`/api/users/${data.user.id}/password`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ currentPassword, newPassword })
		});

		passwordLoading = false;

		if (res.ok) {
			passwordSuccess = true;
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
		} else {
			const text = await res.text().catch(() => '');
			passwordError = text || 'Failed to change password.';
		}
	}
</script>

<div class="max-w-lg space-y-8">
	<h1 class="text-[1.5rem] font-bold">Settings</h1>

	<section class="rounded-xl border border-border bg-card p-6 space-y-5">
		<div>
			<h2 class="text-[1rem] font-semibold">Profile</h2>
			<p class="text-[0.875rem] text-muted-foreground mt-0.5">{data.user.name} — {data.user.email}</p>
		</div>

		<form onsubmit={saveTelegram} class="space-y-4">
			<div class="space-y-1.5">
				<Label for="telegram">Telegram Chat ID</Label>
				<Input id="telegram" bind:value={telegramChatId} placeholder="Optional" />
				<p class="text-[0.75rem] text-muted-foreground">Used to receive notifications via Telegram.</p>
			</div>

			{#if telegramError}
				<p class="text-[0.875rem] text-destructive">{telegramError}</p>
			{/if}
			{#if telegramSuccess}
				<p class="text-[0.875rem] text-green-600">Saved.</p>
			{/if}

			<Button type="submit" disabled={telegramLoading}>
				{telegramLoading ? 'Saving…' : 'Save'}
			</Button>
		</form>
	</section>

	<section class="rounded-xl border border-border bg-card p-6 space-y-5">
		<h2 class="text-[1rem] font-semibold">Change password</h2>

		<form onsubmit={changePassword} class="space-y-4">
			<div class="space-y-1.5">
				<Label for="current">Current password</Label>
				<Input id="current" type="password" bind:value={currentPassword} required />
			</div>

			<div class="space-y-1.5">
				<Label for="new">New password</Label>
				<Input id="new" type="password" bind:value={newPassword} required minlength={8} />
			</div>

			<div class="space-y-1.5">
				<Label for="confirm">Confirm new password</Label>
				<Input id="confirm" type="password" bind:value={confirmPassword} required />
			</div>

			{#if passwordError}
				<p class="text-[0.875rem] text-destructive">{passwordError}</p>
			{/if}
			{#if passwordSuccess}
				<p class="text-[0.875rem] text-green-600">Password changed successfully.</p>
			{/if}

			<Button type="submit" disabled={passwordLoading}>
				{passwordLoading ? 'Saving…' : 'Change password'}
			</Button>
		</form>
	</section>
</div>
