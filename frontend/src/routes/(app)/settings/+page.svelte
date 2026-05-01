<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { untrack } from 'svelte';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	// Avatar
	let avatarPreview = $state(untrack(() => data.user.avatarUrl ?? null));
	let avatarSaving = $state(false);
	let avatarError = $state('');

	function resizeImage(file: File, maxPx: number): Promise<string> {
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const img = new Image();
				img.onload = () => {
					const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
					const canvas = document.createElement('canvas');
					canvas.width = Math.round(img.width * ratio);
					canvas.height = Math.round(img.height * ratio);
					canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
					resolve(canvas.toDataURL('image/jpeg', 0.85));
				};
				img.src = e.target!.result as string;
			};
			reader.readAsDataURL(file);
		});
	}

	async function handleAvatarFile(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		if (!file.type.startsWith('image/')) { avatarError = 'Please select an image file.'; return; }
		if (file.size > 5 * 1024 * 1024) { avatarError = 'File must be under 5 MB.'; return; }
		avatarError = '';
		avatarSaving = true;
		const dataUrl = await resizeImage(file, 256);
		avatarPreview = dataUrl;
		const res = await fetch(`/api/users/${data.user.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ avatarUrl: dataUrl })
		});
		avatarSaving = false;
		if (!res.ok) { avatarError = 'Failed to save photo.'; avatarPreview = data.user.avatarUrl ?? null; return; }
		await invalidateAll();
	}

	async function removeAvatar() {
		avatarSaving = true;
		avatarPreview = null;
		await fetch(`/api/users/${data.user.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ avatarUrl: null })
		});
		avatarSaving = false;
		await invalidateAll();
	}

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
		telegramLinkUrl = '';
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

	function initials(n: string) {
		return n.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
	}
</script>

<div class="max-w-lg space-y-8">
	<!-- Page header -->
	<div class="flex items-center gap-5">
		<div class="relative shrink-0 group">
			<button
				type="button"
				onclick={() => document.getElementById('avatar-file')?.click()}
				class="size-16 rounded-2xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
				aria-label="Change profile picture"
				disabled={avatarSaving}
			>
				{#if avatarPreview}
					<img src={avatarPreview} alt={data.user.name} class="size-full object-cover" />
				{:else}
					<div class="size-full bg-primary/10 flex items-center justify-center">
						<span class="text-primary text-[1.5rem] font-bold tracking-tight select-none">{initials(data.user.name)}</span>
					</div>
				{/if}
				<div class="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
					<svg class="size-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
					</svg>
				</div>
			</button>
			<input id="avatar-file" type="file" accept="image/*" class="hidden" onchange={handleAvatarFile} />
			{#if avatarPreview}
				<button
					type="button"
					onclick={removeAvatar}
					disabled={avatarSaving}
					class="absolute -bottom-1 -right-1 size-5 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
					aria-label="Remove photo"
				>
					<svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
				</button>
			{/if}
		</div>
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-3 flex-wrap">
				<h1 class="text-[1.75rem] font-bold leading-tight">{data.user.name}</h1>
				<span
					class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide bg-secondary text-secondary-foreground"
				>
					{data.user.role ?? 'member'}
				</span>
			</div>
			<p class="text-muted-foreground text-[0.875rem] mt-0.5">{data.user.email}</p>
		</div>
	</div>

	{#if avatarError}
		<p class="text-[0.8125rem] text-destructive -mt-4">{avatarError}</p>
	{/if}
	{#if avatarSaving}
		<p class="text-[0.8125rem] text-muted-foreground -mt-4">Saving…</p>
	{/if}

	<!-- Telegram section -->
	<section class="rounded-xl border border-border bg-card p-6 space-y-4">
		<div class="flex items-center gap-2">
			<div class="size-1.5 rounded-full bg-primary"></div>
			<h2 class="text-[0.9375rem] font-semibold">Telegram</h2>
		</div>

		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2.5">
				{#if data.user.telegramChatId}
					<span class="relative flex size-2.5">
						<span
							class="animate-ping absolute inline-flex size-full rounded-full bg-[var(--color-status-green)] opacity-75"
						></span>
						<span
							class="relative inline-flex rounded-full size-2.5 bg-[var(--color-status-green)]"
						></span>
					</span>
					<span class="text-[0.875rem] font-medium">Connected</span>
				{:else}
					<span class="size-2.5 rounded-full bg-muted-foreground/30 shrink-0"></span>
					<span class="text-[0.875rem] text-muted-foreground">Not connected</span>
				{/if}
			</div>

			{#if data.user.telegramChatId}
				<Button variant="outline" size="sm" onclick={disconnectTelegram}>Disconnect</Button>
			{:else}
				<Button
					variant="outline"
					size="sm"
					onclick={generateTelegramLink}
					disabled={telegramLinkLoading}
				>
					{telegramLinkLoading ? 'Generating…' : 'Generate connect link'}
				</Button>
			{/if}
		</div>

		{#if telegramLinkUrl}
			<div class="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
				<p class="text-[0.75rem] text-muted-foreground leading-relaxed">
					Click the link below to open the bot and connect your account automatically. Expires in
					24h.
				</p>
				<div class="flex items-center gap-2 rounded-md bg-background border border-border px-3 py-2">
					<code class="flex-1 truncate text-[0.75rem] text-foreground">{telegramLinkUrl}</code>
					<button
						type="button"
						onclick={copyLink}
						class="shrink-0 text-[0.75rem] font-medium text-primary hover:text-primary/70 transition-colors"
					>
						{telegramLinkCopied ? '✓ Copied' : 'Copy'}
					</button>
				</div>
			</div>
		{/if}
	</section>

	<!-- Security section -->
	<section class="rounded-xl border border-border bg-card p-6 space-y-5">
		<div class="flex items-center gap-2">
			<div class="size-1.5 rounded-full bg-primary"></div>
			<h2 class="text-[0.9375rem] font-semibold">Change password</h2>
		</div>

		<form onsubmit={changePassword} class="space-y-4">
			<div class="space-y-1.5">
				<Label for="current" class="text-[0.8125rem]">Current password</Label>
				<Input id="current" type="password" bind:value={currentPassword} required />
			</div>

			<div class="space-y-1.5">
				<Label for="new" class="text-[0.8125rem]">New password</Label>
				<Input id="new" type="password" bind:value={newPassword} required minlength={8} />
			</div>

			<div class="space-y-1.5">
				<Label for="confirm" class="text-[0.8125rem]">Confirm new password</Label>
				<Input id="confirm" type="password" bind:value={confirmPassword} required />
			</div>

			<div class="flex items-center justify-between pt-1">
				<div>
					{#if passwordError}
						<p class="text-[0.8125rem] text-destructive">{passwordError}</p>
					{:else if passwordSuccess}
						<p class="text-[0.8125rem] text-[var(--color-status-green)]">Password changed.</p>
					{/if}
				</div>
				<Button type="submit" size="sm" disabled={passwordLoading}>
					{passwordLoading ? 'Saving…' : 'Change password'}
				</Button>
			</div>
		</form>
	</section>
</div>
