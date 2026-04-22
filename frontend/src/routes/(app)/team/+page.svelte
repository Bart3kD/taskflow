<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Settings, Mail, MessageCircle, MessageCircleOff, UserPlus } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const others = $derived(data.members.filter((m) => m.id !== data.currentUserId));

	let dialogOpen = $state(false);
	let addName = $state('');
	let addEmail = $state('');
	let addRole = $state<'admin' | 'member'>('member');
	let addError = $state('');
	let addLoading = $state(false);

	async function addUser(e: SubmitEvent) {
		e.preventDefault();
		addLoading = true;
		addError = '';
		const res = await fetch('/api/users', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: addName, email: addEmail, role: addRole })
		});
		addLoading = false;
		if (res.ok) {
			dialogOpen = false;
			addName = '';
			addEmail = '';
			location.reload();
		} else {
			addError = 'Failed to add user.';
		}
	}

	function initials(name: string): string {
		return name
			.split(' ')
			.map((w) => w[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}

	function channelLabel(channel: string | null): string {
		if (channel === 'both') return 'Email & Telegram';
		if (channel === 'telegram') return 'Telegram';
		return 'Email';
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-[1.5rem] font-bold">Team</h1>
		<Dialog.Root bind:open={dialogOpen}>
			<Dialog.Trigger>
				<Button class="gap-1.5">
					<UserPlus class="size-4" />
					Add member
				</Button>
			</Dialog.Trigger>
			<Dialog.Content class="sm:max-w-md">
				<Dialog.Header>
					<Dialog.Title>Add new member</Dialog.Title>
					<Dialog.Description>A temporary password will be generated and sent to the member's email.</Dialog.Description>
				</Dialog.Header>
				<form onsubmit={addUser} class="space-y-4 mt-2">
					<div class="grid grid-cols-2 gap-3">
						<div class="space-y-1.5">
							<label class="text-[0.8125rem] font-medium" for="add-name">Name</label>
							<input id="add-name" bind:value={addName} required class="w-full rounded-md border border-input bg-background px-3 py-1.5 text-[0.875rem]" />
						</div>
						<div class="space-y-1.5">
							<label class="text-[0.8125rem] font-medium" for="add-role">Role</label>
							<Select.Root bind:value={addRole}>
								<Select.Trigger class="w-full">
									<Select.Value label={addRole === 'admin' ? 'Admin' : 'Member'} />
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="member">Member</Select.Item>
									<Select.Item value="admin">Admin</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>
					</div>
					<div class="space-y-1.5">
						<label class="text-[0.8125rem] font-medium" for="add-email">Email</label>
						<input id="add-email" type="email" bind:value={addEmail} required class="w-full rounded-md border border-input bg-background px-3 py-1.5 text-[0.875rem]" />
					</div>
					{#if addError}
						<p class="text-[0.875rem] text-destructive">{addError}</p>
					{/if}
					<Dialog.Footer>
						<Button type="submit" disabled={addLoading}>{addLoading ? 'Adding…' : 'Add member'}</Button>
						<Button type="button" variant="outline" onclick={() => (dialogOpen = false)}>Cancel</Button>
					</Dialog.Footer>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
		{#each others as member}
			<Card.Root class="flex flex-col p-0 overflow-hidden">
				<!-- Image -->
				<div class="w-full aspect-[3/2] bg-primary/10 flex items-center justify-center select-none">
					<span class="text-primary text-[2rem] font-semibold">{initials(member.name)}</span>
				</div>

				<!-- Content (badge positioned here) -->
				<div class="relative flex flex-col flex-1 px-3 pb-3 gap-1.5">
					{#if member.role === 'admin'}
						<span class="absolute top-0 right-3 rounded-md bg-primary px-2 py-0.5 text-[0.625rem] font-semibold text-primary-foreground">
							Admin
						</span>
					{/if}
					<div class="text-left">
						<p class="font-semibold text-[0.9375rem] leading-snug">{member.name}</p>
						<p class="text-[0.75rem] text-muted-foreground mt-0.5">{member.email}</p>
					</div>

					<div class="flex flex-col items-start gap-1 text-[0.75rem]">
						<div class="flex items-center gap-1.5 text-muted-foreground">
							{#if member.telegramChatId}
								<MessageCircle class="size-3.5 shrink-0" />
								Telegram connected
							{:else}
								<MessageCircleOff class="size-3.5 shrink-0" />
								Not connected
							{/if}
						</div>
						<div class="flex items-center gap-1.5 text-muted-foreground">
							<Mail class="size-3.5 shrink-0" />
							Reminders via {channelLabel(member.reminderChannel)}
						</div>
					</div>

					<a
						href="/team/{member.id}"
						class="mt-auto inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-[0.8125rem] font-medium hover:bg-accent transition-colors"
					>
						<Settings class="size-3.5" />
						Settings
					</a>
				</div>
			</Card.Root>
		{/each}

	</div>
</div>
