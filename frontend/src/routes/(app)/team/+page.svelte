<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { UserPlus, Settings } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let showAdd = $state(false);
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
			showAdd = false;
			addName = '';
			addEmail = '';
			location.reload();
		} else {
			addError = 'Failed to add user.';
		}
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-[1.5rem] font-bold">Team</h1>
		<Button onclick={() => (showAdd = !showAdd)} class="gap-1.5">
			<UserPlus class="size-4" />
			Add member
		</Button>
	</div>

	{#if showAdd}
		<form
			onsubmit={addUser}
			class="rounded-xl border border-border bg-card p-5 space-y-4 max-w-md"
		>
			<h2 class="text-[0.875rem] font-semibold">Add new member</h2>

			<div class="grid grid-cols-2 gap-3">
				<div class="space-y-1">
					<label class="text-[0.8125rem] font-medium" for="add-name">Name</label>
					<input
						id="add-name"
						bind:value={addName}
						required
						class="w-full rounded-md border border-input bg-background px-3 py-1.5 text-[0.875rem]"
					/>
				</div>
				<div class="space-y-1">
					<label class="text-[0.8125rem] font-medium" for="add-role">Role</label>
					<select
						id="add-role"
						bind:value={addRole}
						class="w-full rounded-md border border-input bg-background px-3 py-1.5 text-[0.875rem]"
					>
						<option value="member">Member</option>
						<option value="admin">Admin</option>
					</select>
				</div>
			</div>

			<div class="space-y-1">
				<label class="text-[0.8125rem] font-medium" for="add-email">Email</label>
				<input
					id="add-email"
					type="email"
					bind:value={addEmail}
					required
					class="w-full rounded-md border border-input bg-background px-3 py-1.5 text-[0.875rem]"
				/>
			</div>

			<p class="text-[0.75rem] text-muted-foreground">A temporary password will be generated and sent to the member's email.</p>

{#if addError}
				<p class="text-[0.875rem] text-destructive">{addError}</p>
			{/if}

			<div class="flex gap-2">
				<Button type="submit" disabled={addLoading}>
					{addLoading ? 'Adding…' : 'Add member'}
				</Button>
				<Button type="button" variant="outline" onclick={() => (showAdd = false)}>Cancel</Button>
			</div>
		</form>
	{/if}

	<div class="rounded-xl border border-border bg-card overflow-hidden">
		<table class="w-full text-[0.875rem]">
			<thead>
				<tr class="border-b border-border bg-muted/40">
					<th class="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
					<th class="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
					<th class="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
					<th class="px-4 py-3 text-left font-medium text-muted-foreground">Reports via</th>
					<th class="px-4 py-3 text-left font-medium text-muted-foreground">Reminders via</th>
					<th class="px-4 py-3"></th>
				</tr>
			</thead>
			<tbody>
				{#each data.members as member}
					<tr class="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
						<td class="px-4 py-3 font-medium">{member.name}</td>
						<td class="px-4 py-3 text-muted-foreground">{member.email}</td>
						<td class="px-4 py-3 capitalize text-muted-foreground">{member.role}</td>
						<td class="px-4 py-3 capitalize text-muted-foreground">{member.reportChannel ?? '—'}</td>
						<td class="px-4 py-3 capitalize text-muted-foreground">{member.reminderChannel ?? '—'}</td>
						<td class="px-4 py-3 text-right">
							<a
								href="/team/{member.id}"
								class="inline-flex items-center gap-1 text-[0.875rem] text-primary hover:underline"
							>
								<Settings class="size-3.5" />
								Settings
							</a>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
