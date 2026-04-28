<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import SegmentedControl from '$lib/components/SegmentedControl.svelte';
	import { untrack } from 'svelte';

	let { data }: { data: PageData } = $props();

	// User fields
	let name = $state(untrack(() => data.member.name));
	let userError = $state('');
	let userLoading = $state(false);
	let userSuccess = $state(false);

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
	let reportDayOfWeek = $state(String(untrack(() => data.schedule?.reportDayOfWeek ?? 0)));
	let reportTime = $state(untrack(() => data.schedule?.reportTime ?? '09:00'));
	let reportChannel = $state(untrack(() => data.schedule?.reportChannel ?? 'email'));
	let reminderChannel = $state(untrack(() => data.schedule?.reminderChannel ?? 'email'));

	let reminderDaysSet = $state(new Set<number>(untrack(() => data.schedule?.reminderDaysBefore ?? [2, 1, 0])));

	function toggleDay(day: number) {
		const next = new Set(reminderDaysSet);
		if (next.has(day)) next.delete(day);
		else next.add(day);
		reminderDaysSet = next;
	}

	let scheduleError = $state('');
	let scheduleSuccess = $state(false);
	let scheduleLoading = $state(false);

	const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

	async function saveUser(e: SubmitEvent) {
		e.preventDefault();
		userLoading = true;
		userError = '';
		userSuccess = false;
		const res = await fetch(`/api/users/${data.member.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name })
		});
		userLoading = false;
		if (!res.ok) userError = 'Failed to save changes.';
		else {
			userSuccess = true;
			await invalidateAll();
		}
	}

	async function saveSchedule(e: SubmitEvent) {
		e.preventDefault();
		scheduleLoading = true;
		scheduleError = '';
		scheduleSuccess = false;

		const days = [...reminderDaysSet].filter((n) => n >= 0).sort((a, b) => b - a);

		const res = await fetch(`/api/users/${data.member.id}/schedule`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				reportFrequency,
				reportEveryNDays: reportFrequency === 'every_n_days' ? reportEveryNDays : undefined,
				reportDayOfWeek: reportFrequency === 'weekly' ? parseInt(reportDayOfWeek) : undefined,
				reportTime,
				reportChannel,
				reminderChannel,
				reminderDaysBefore: days
			})
		});
		scheduleLoading = false;
		if (!res.ok) scheduleError = 'Failed to save schedule.';
		else {
			scheduleSuccess = true;
			await invalidateAll();
		}
	}

	function initials(n: string): string {
		return n
			.split(' ')
			.map((w) => w[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}

	const reminderDayOptions = [0, 1, 2, 3, 5, 7];

	const frequencyOptions: Array<{ value: 'every_n_days' | 'weekly'; label: string }> = [
		{ value: 'every_n_days', label: 'Every N days' },
		{ value: 'weekly', label: 'Weekly' }
	];

	const channelOptions: Array<{ value: 'email' | 'telegram' | 'both'; label: string }> = [
		{ value: 'email', label: 'Email' },
		{ value: 'telegram', label: 'Telegram' },
		{ value: 'both', label: 'Both' }
	];
</script>

<div class="space-y-8 max-w-4xl">
	<!-- Page header -->
	<div>
		<a
			href="/team"
			class="inline-flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground hover:text-foreground transition-colors mb-6"
		>
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="m15 18-6-6 6-6" />
			</svg>
			Back to team
		</a>

		<div class="flex items-center gap-5">
			<div
				class="size-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 select-none"
			>
				<span class="text-primary text-[1.5rem] font-bold tracking-tight"
					>{initials(data.member.name)}</span
				>
			</div>
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-3 flex-wrap">
					<h1 class="text-[1.75rem] font-bold leading-tight">{data.member.name}</h1>
					<span
						class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide
						{data.member.role === 'admin'
							? 'bg-primary text-primary-foreground'
							: 'bg-secondary text-secondary-foreground'}"
					>
						{data.member.role}
					</span>
				</div>
				<p class="text-muted-foreground text-[0.875rem] mt-0.5">{data.member.email}</p>
			</div>
		</div>
	</div>

	<!-- Content grid -->
	<div class="grid lg:grid-cols-[1fr_1.25fr] gap-6 items-start">
		<!-- Left column: Profile + Telegram -->
		<div class="space-y-5">
			<!-- Profile section -->
			<section class="rounded-xl border border-border bg-card p-6 space-y-5">
				<div class="flex items-center gap-2">
					<div class="size-1.5 rounded-full bg-primary"></div>
					<h2 class="text-[0.9375rem] font-semibold">Profile</h2>
				</div>

				<form onsubmit={saveUser} class="space-y-4">
					<div class="space-y-1.5">
						<Label for="name" class="text-[0.8125rem]">Display name</Label>
						<Input id="name" bind:value={name} required />
					</div>

					<div class="space-y-1.5">
						<Label for="email" class="text-[0.8125rem]">Email address</Label>
						<Input id="email" value={data.member.email} disabled class="opacity-50 cursor-not-allowed" />
					</div>

					<div class="flex items-center justify-between pt-1">
						<div>
							{#if userError}
								<p class="text-[0.8125rem] text-destructive">{userError}</p>
							{:else if userSuccess}
								<p class="text-[0.8125rem] text-[var(--color-status-green)]">Changes saved.</p>
							{/if}
						</div>
						<Button type="submit" size="sm" disabled={userLoading}>
							{userLoading ? 'Saving…' : 'Save profile'}
						</Button>
					</div>
				</form>
			</section>

			<!-- Telegram section -->
			<section class="rounded-xl border border-border bg-card p-6 space-y-4">
				<div class="flex items-center gap-2">
					<div class="size-1.5 rounded-full bg-primary"></div>
					<h2 class="text-[0.9375rem] font-semibold">Telegram</h2>
				</div>

				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2.5">
						{#if data.member.telegramChatId}
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
					{#if data.member.telegramChatId}
						<Button variant="outline" size="sm" onclick={disconnectTelegram}>Disconnect</Button>
					{:else}
						<Button
							variant="outline"
							size="sm"
							onclick={generateTelegramLink}
							disabled={telegramLinkLoading}
						>
							{telegramLinkLoading ? 'Generating…' : 'Generate link'}
						</Button>
					{/if}
				</div>

				{#if telegramLinkUrl}
					<div class="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
						<p class="text-[0.75rem] text-muted-foreground leading-relaxed">
							Share with <strong class="text-foreground">{data.member.name}</strong> — after clicking,
							the bot connects automatically. Expires in 24h.
						</p>
						<div
							class="flex items-center gap-2 rounded-md bg-background border border-border px-3 py-2"
						>
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
		</div>

		<!-- Right column: Schedule -->
		<section class="rounded-xl border border-border bg-card p-6 space-y-6">
			<div class="flex items-center gap-2">
				<div class="size-1.5 rounded-full bg-primary"></div>
				<h2 class="text-[0.9375rem] font-semibold">Notification schedule</h2>
			</div>

			<form onsubmit={saveSchedule} class="space-y-6">
				<!-- Report frequency -->
				<div class="space-y-3">
					<p class="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
						Report frequency
					</p>
					<div class="space-y-2.5">
						<SegmentedControl options={frequencyOptions} bind:value={reportFrequency} />

						{#if reportFrequency === 'every_n_days'}
							<div class="flex items-center gap-3">
								<span class="text-[0.8125rem] text-muted-foreground shrink-0">Every</span>
								<Input
									id="repN"
									type="number"
									min="1"
									bind:value={reportEveryNDays}
									class="w-20"
								/>
								<span class="text-[0.8125rem] text-muted-foreground">days</span>
							</div>
						{/if}

						{#if reportFrequency === 'weekly'}
							<Select.Root bind:value={reportDayOfWeek}>
								<Select.Trigger class="w-44">
									<Select.Value label={weekdays[parseInt(reportDayOfWeek)]} />
								</Select.Trigger>
								<Select.Content>
									{#each weekdays as day, i}
										<Select.Item value={String(i)}>{day}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						{/if}
					</div>
				</div>

				<!-- Send time -->
				<div class="space-y-2.5">
					<p class="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
						Send time
					</p>
					<Input id="repTime" type="time" bind:value={reportTime} class="w-36" />
				</div>

				<!-- Channels -->
				<div class="space-y-3">
					<p class="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
						Channels
					</p>
					<div class="space-y-3">
						<div class="space-y-1.5">
							<p class="text-[0.8125rem] text-foreground">Reports</p>
							<SegmentedControl options={channelOptions} bind:value={reportChannel} />
						</div>

						<div class="space-y-1.5">
							<p class="text-[0.8125rem] text-foreground">Reminders</p>
							<SegmentedControl options={channelOptions} bind:value={reminderChannel} />
						</div>
					</div>
				</div>

				<!-- Reminder timing -->
				<div class="space-y-3">
					<p class="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
						Remind before deadline
					</p>
					<div class="flex flex-wrap gap-2">
						{#each reminderDayOptions as day}
							<button
								type="button"
								class="px-3 py-1.5 rounded-full border text-[0.8125rem] font-medium transition-all
									{reminderDaysSet.has(day)
									? 'bg-primary text-primary-foreground border-primary'
									: 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'}"
								onclick={() => toggleDay(day)}
							>
								{day === 0 ? 'On due date' : `${day}d before`}
							</button>
						{/each}
					</div>
				</div>

				<div class="flex items-center justify-between pt-2 border-t border-border">
					<div>
						{#if scheduleError}
							<p class="text-[0.8125rem] text-destructive">{scheduleError}</p>
						{:else if scheduleSuccess}
							<p class="text-[0.8125rem] text-[var(--color-status-green)]">Schedule saved.</p>
						{/if}
					</div>
					<Button type="submit" size="sm" disabled={scheduleLoading}>
						{scheduleLoading ? 'Saving…' : 'Save schedule'}
					</Button>
				</div>
			</form>
		</section>
	</div>
</div>
