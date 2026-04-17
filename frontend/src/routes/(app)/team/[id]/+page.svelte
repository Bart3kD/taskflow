<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	import { untrack } from 'svelte';

	let { data }: { data: PageData } = $props();

	// User fields
	let name = $state(untrack(() => data.member.name));
	let userError = $state('');
	let userLoading = $state(false);

	// Telegram connection
	let telegramLinkUrl = $state('');
	let telegramLinkLoading = $state(false);
	let telegramLinkCopied = $state(false);

	async function generateTelegramLink() {
		telegramLinkLoading = true;
		const res = await fetch('/api/telegram/link', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId: data.member.id })
		});
		telegramLinkLoading = false;
		if (res.ok) {
			const { url } = await res.json();
			telegramLinkUrl = url;
		}
	}

	async function disconnectTelegram() {
		await fetch(`/api/users/${data.member.id}`, {
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

	// Schedule fields
	let reportFrequency = $state(untrack(() => data.schedule?.reportFrequency ?? 'every_n_days'));
	let reportEveryNDays = $state(untrack(() => data.schedule?.reportEveryNDays ?? 7));
	let reportDayOfWeek = $state(untrack(() => data.schedule?.reportDayOfWeek ?? 1));
	let reportTime = $state(untrack(() => data.schedule?.reportTime ?? '09:00'));
	let reportChannel = $state(untrack(() => data.schedule?.reportChannel ?? 'email'));
	let reminderChannel = $state(untrack(() => data.schedule?.reminderChannel ?? 'email'));
	let reminderDaysBefore = $state(untrack(() => (data.schedule?.reminderDaysBefore ?? [2, 1, 0]).join(', ')));
	let scheduleError = $state('');
	let scheduleLoading = $state(false);

	const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

	async function saveUser(e: SubmitEvent) {
		e.preventDefault();
		userLoading = true;
		userError = '';
		const res = await fetch(`/api/users/${data.member.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name })
		});
		userLoading = false;
		if (!res.ok) userError = 'Failed to save changes.';
		else await invalidateAll();
	}

	async function saveSchedule(e: SubmitEvent) {
		e.preventDefault();
		scheduleLoading = true;
		scheduleError = '';

		const days = reminderDaysBefore
			.split(',')
			.map((s) => parseInt(s.trim(), 10))
			.filter((n) => !isNaN(n) && n >= 0);

		const res = await fetch(`/api/users/${data.member.id}/schedule`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				reportFrequency,
				reportEveryNDays: reportFrequency === 'every_n_days' ? reportEveryNDays : undefined,
				reportDayOfWeek: reportFrequency === 'weekly' ? reportDayOfWeek : undefined,
				reportTime,
				reportChannel,
				reminderChannel,
				reminderDaysBefore: days
			})
		});
		scheduleLoading = false;
		if (!res.ok) scheduleError = 'Failed to save schedule.';
		else await invalidateAll();
	}
</script>

<div class="max-w-2xl space-y-8">
	<div class="flex items-center gap-3">
		<a href="/team" class="text-[0.875rem] text-muted-foreground hover:text-foreground">← Team</a>
		<h1 class="text-[1.5rem] font-bold">{data.member.name}</h1>
	</div>

	<!-- User info section -->
	<section class="rounded-xl border border-border bg-card p-6 space-y-5">
		<h2 class="text-[1rem] font-semibold">User details</h2>

		<form onsubmit={saveUser} class="space-y-4">
			<div class="space-y-1.5">
				<Label for="name">Name</Label>
				<Input id="name" bind:value={name} required />
			</div>

			<div class="space-y-1.5">
				<Label for="email">Email</Label>
				<Input id="email" value={data.member.email} disabled class="opacity-60" />
			</div>

			{#if userError}
				<p class="text-[0.875rem] text-destructive">{userError}</p>
			{/if}

			<Button type="submit" disabled={userLoading}>
				{userLoading ? 'Saving…' : 'Save'}
			</Button>
		</form>

		<div class="border-t border-border pt-5 space-y-3">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[0.875rem] font-medium">Telegram</p>
					{#if data.member.telegramChatId}
						<p class="text-[0.75rem] text-green-600 dark:text-green-400">✓ Connected</p>
					{:else}
						<p class="text-[0.75rem] text-muted-foreground">Not connected</p>
					{/if}
				</div>
				{#if data.member.telegramChatId}
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
						Share this link with <strong>{data.member.name}</strong>. After clicking it and opening the bot, Telegram will be connected automatically. Link expires in 24h.
					</p>
					<div class="flex items-center gap-2">
						<code class="flex-1 truncate text-[0.75rem]">{telegramLinkUrl}</code>
						<Button variant="outline" size="sm" onclick={copyLink}>
							{telegramLinkCopied ? 'Copied!' : 'Copy'}
						</Button>
					</div>
				</div>
			{/if}
		</div>
	</section>

	<!-- Notification schedule section -->
	<section class="rounded-xl border border-border bg-card p-6 space-y-5">
		<h2 class="text-[1rem] font-semibold">Notification schedule</h2>

		<form onsubmit={saveSchedule} class="space-y-4">
			<div class="space-y-1.5">
				<Label for="repFreq">Report frequency</Label>
				<select
					id="repFreq"
					bind:value={reportFrequency}
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-[0.875rem]"
				>
					<option value="every_n_days">Every N days (configured per report send)</option>
					<option value="weekly">Weekly</option>
				</select>
			</div>

			{#if reportFrequency === 'every_n_days'}
				<div class="space-y-1.5">
					<Label for="repN">Every N days</Label>
					<Input id="repN" type="number" min="1" bind:value={reportEveryNDays} />
				</div>
			{/if}

			{#if reportFrequency === 'weekly'}
				<div class="space-y-1.5">
					<Label for="repDow">Day of week</Label>
					<select
						id="repDow"
						bind:value={reportDayOfWeek}
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-[0.875rem]"
					>
						{#each weekdays as day, i}
							<option value={i}>{day}</option>
						{/each}
					</select>
				</div>
			{/if}

			<div class="space-y-1.5">
				<Label for="repTime">Send time</Label>
				<Input id="repTime" type="time" bind:value={reportTime} />
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<Label for="repChannel">Report channel</Label>
					<select
						id="repChannel"
						bind:value={reportChannel}
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-[0.875rem]"
					>
						<option value="email">Email</option>
						<option value="telegram">Telegram</option>
						<option value="both">Both</option>
					</select>
				</div>

				<div class="space-y-1.5">
					<Label for="remChannel">Reminder channel</Label>
					<select
						id="remChannel"
						bind:value={reminderChannel}
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-[0.875rem]"
					>
						<option value="email">Email</option>
						<option value="telegram">Telegram</option>
						<option value="both">Both</option>
					</select>
				</div>
			</div>

			<div class="space-y-1.5">
				<Label for="remDays">Reminder days before deadline</Label>
				<Input
					id="remDays"
					bind:value={reminderDaysBefore}
					placeholder="e.g. 2, 1, 0"
				/>
				<p class="text-[0.75rem] text-muted-foreground">Comma-separated. 0 = on the deadline day.</p>
			</div>

			{#if scheduleError}
				<p class="text-[0.875rem] text-destructive">{scheduleError}</p>
			{/if}

			<Button type="submit" disabled={scheduleLoading}>
				{scheduleLoading ? 'Saving…' : 'Save schedule'}
			</Button>
		</form>
	</section>
</div>
