<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';

	let { data }: { data: PageData } = $props();

	// Telegram
	let telegramLinkUrl = $state('');
	let telegramLinkLoading = $state(false);
	let telegramLinkCopied = $state(false);

	async function generateTelegramLink() {
		telegramLinkLoading = true;
		const res = await fetch('/api/telegram/link', { method: 'POST' });
		telegramLinkLoading = false;
		if (res.ok) {
			const { url } = await res.json();
			telegramLinkUrl = url;
		}
	}

	async function disconnectTelegram() {
		await fetch(`/api/users/${data.user.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ telegramChatId: null })
		});
		await invalidateAll();
	}

	function copyLink() {
		navigator.clipboard.writeText(telegramLinkUrl);
		telegramLinkCopied = true;
		setTimeout(() => (telegramLinkCopied = false), 2000);
	}

	// Password
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let passwordLoading = $state(false);
	let passwordError = $state('');
	let passwordSuccess = $state(false);

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

		<div class="flex items-center justify-between">
			<div>
				<p class="text-[0.875rem] font-medium">Telegram</p>
				{#if data.user.telegramChatId}
					<p class="text-[0.75rem] text-green-600 dark:text-green-400">✓ Connected</p>
				{:else}
					<p class="text-[0.75rem] text-muted-foreground">Not connected</p>
				{/if}
			</div>
			{#if data.user.telegramChatId}
				<Button variant="outline" onclick={disconnectTelegram}>Disconnect</Button>
			{:else}
				<Button variant="outline" onclick={generateTelegramLink} disabled={telegramLinkLoading}>
					{telegramLinkLoading ? 'Generating…' : 'Generate connect link'}
				</Button>
			{/if}
		</div>

		{#if telegramLinkUrl}
			<div class="rounded-md border border-border bg-muted/40 p-3 space-y-2">
				<p class="text-[0.75rem] text-muted-foreground">
					Click the link below to open the Telegram bot and connect your account automatically. Link expires in 24h.
				</p>
				<div class="flex items-center gap-2">
					<code class="flex-1 truncate text-[0.75rem]">{telegramLinkUrl}</code>
					<Button variant="outline" size="sm" onclick={copyLink}>
						{telegramLinkCopied ? 'Copied!' : 'Copy'}
					</Button>
				</div>
			</div>
		{/if}
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
