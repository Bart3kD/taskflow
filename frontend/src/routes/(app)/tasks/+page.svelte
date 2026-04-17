<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Plus, AlertCircle } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

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

	function formatDate(d: Date | null) {
		if (!d) return '—';
		return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-[1.5rem] font-bold">Tasks</h1>
		{#if data.user.role === 'admin'}
			<Button href="/tasks/new" class="gap-1.5">
				<Plus class="size-4" />
				New Task
			</Button>
		{/if}
	</div>

	<div class="rounded-xl border border-border bg-card overflow-hidden">
		{#if data.tasks.length === 0}
			<div class="flex flex-col items-center gap-2 py-16 text-muted-foreground">
				<AlertCircle class="size-8" />
				<p class="text-[0.875rem]">No tasks yet.</p>
				{#if data.user.role === 'admin'}
					<Button href="/tasks/new" variant="outline" class="mt-2">Create your first task</Button>
				{/if}
			</div>
		{:else}
			<table class="w-full text-[0.875rem]">
				<thead>
					<tr class="border-b border-border bg-muted/40">
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
						{#if data.user.role === 'admin'}
							<th class="px-4 py-3 text-left font-medium text-muted-foreground">Assignee</th>
						{/if}
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Deadline</th>
						<th class="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody>
					{#each data.tasks as task}
						<tr class="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
							<td class="px-4 py-3 font-medium">{task.title}</td>
							{#if data.user.role === 'admin'}
								<td class="px-4 py-3 text-muted-foreground">{task.assigneeName ?? '—'}</td>
							{/if}
							<td class="px-4 py-3 text-muted-foreground capitalize">{task.deadlineType}</td>
							<td class="px-4 py-3">
								<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.75rem] font-medium {statusColors[task.status]}">
									{statusLabels[task.status]}
								</span>
							</td>
							<td class="px-4 py-3 text-muted-foreground">{formatDate(task.deadlineDate)}</td>
							<td class="px-4 py-3 text-right">
								<a href="/tasks/{task.id}" class="text-[0.875rem] text-primary hover:underline">Edit</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
