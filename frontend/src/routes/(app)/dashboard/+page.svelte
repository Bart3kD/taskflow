<script lang="ts">
	import type { PageData } from './$types';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Plus, AlertCircle } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let filterStatus = $state('');
	let filterMember = $state('');

	const statusColors: Record<string, string> = {
		pending: 'bg-muted text-muted-foreground',
		in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
		done: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
		overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
		problem: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
	};

	const statusLabels: Record<string, string> = {
		pending: 'Pending',
		in_progress: 'In Progress',
		done: 'Done',
		overdue: 'Overdue',
		problem: 'Problem'
	};

	const filtered = $derived.by(() => {
		return data.tasks.filter((t) => {
			if (filterStatus && t.status !== filterStatus) return false;
			if (filterMember && t.assignedTo !== filterMember) return false;
			return true;
		});
	});

	const counts = $derived.by(() => {
		const c = { pending: 0, in_progress: 0, done: 0, overdue: 0, problem: 0 };
		for (const t of data.tasks) {
			if (t.status in c) c[t.status as keyof typeof c]++;
		}
		return c;
	});

	function formatDate(d: Date | null) {
		if (!d) return '—';
		return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
	}

	function isOverdue(t: (typeof data.tasks)[0]) {
		if (t.status === 'done') return false;
		if (!t.deadlineDate) return false;
		return new Date(t.deadlineDate) < new Date();
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-[1.5rem] font-bold">Dashboard</h1>
		{#if data.user.role === 'admin'}
			<Button href="/tasks/new" class="gap-1.5">
				<Plus class="size-4" />
				New Task
			</Button>
		{/if}
	</div>

	<!-- Counters -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		{#each Object.entries(counts) as [status, count]}
			<button
				onclick={() => (filterStatus = filterStatus === status ? '' : status)}
				class="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent
					{filterStatus === status ? 'ring-2 ring-ring' : ''}"
			>
				<p class="text-[0.75rem] font-medium text-muted-foreground uppercase tracking-wide">
					{statusLabels[status]}
				</p>
				<p class="mt-1 text-[1.5rem] font-bold">{count}</p>
			</button>
		{/each}
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap gap-3">
		<select
			bind:value={filterStatus}
			class="rounded-md border border-border bg-background px-3 py-1.5 text-[0.875rem] text-foreground"
		>
			<option value="">All statuses</option>
			{#each Object.entries(statusLabels) as [val, label]}
				<option value={val}>{label}</option>
			{/each}
		</select>

		{#if data.user.role === 'admin' && data.members.length > 0}
			<select
				bind:value={filterMember}
				class="rounded-md border border-border bg-background px-3 py-1.5 text-[0.875rem] text-foreground"
			>
				<option value="">All members</option>
				{#each data.members as m}
					<option value={m.id}>{m.name}</option>
				{/each}
			</select>
		{/if}

		{#if filterStatus || filterMember}
			<button
				onclick={() => { filterStatus = ''; filterMember = ''; }}
				class="text-[0.875rem] text-muted-foreground hover:text-foreground underline"
			>
				Clear filters
			</button>
		{/if}
	</div>

	<!-- Task table -->
	<div class="rounded-xl border border-border bg-card overflow-hidden">
		{#if filtered.length === 0}
			<div class="flex flex-col items-center gap-2 py-16 text-muted-foreground">
				<AlertCircle class="size-8" />
				<p class="text-[0.875rem]">No tasks found.</p>
			</div>
		{:else}
			<table class="w-full text-[0.875rem]">
				<thead>
					<tr class="border-b border-border bg-muted/40">
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
						{#if data.user.role === 'admin'}
							<th class="px-4 py-3 text-left font-medium text-muted-foreground">Assignee</th>
						{/if}
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Deadline</th>
						<th class="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody>
					{#each filtered as task}
						<tr class="border-b border-border last:border-0 hover:bg-muted/30 transition-colors
							{isOverdue(task) ? 'bg-red-50/50 dark:bg-red-950/20' : ''}">
							<td class="px-4 py-3 font-medium">
								{#if isOverdue(task)}
									<span class="mr-1.5 text-destructive">⚠</span>
								{/if}
								{task.title}
							</td>
							{#if data.user.role === 'admin'}
								<td class="px-4 py-3 text-muted-foreground">{task.assigneeName ?? '—'}</td>
							{/if}
							<td class="px-4 py-3">
								<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.75rem] font-medium {statusColors[task.status]}">
									{statusLabels[task.status]}
								</span>
							</td>
							<td class="px-4 py-3 text-muted-foreground">{formatDate(task.deadlineDate)}</td>
							<td class="px-4 py-3 text-right">
								<a href="/tasks/{task.id}" class="text-[0.875rem] text-primary hover:underline">View</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
