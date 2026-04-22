<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import FacetedFilter from '$lib/components/FacetedFilter.svelte';
	import { Plus, AlertCircle, Play, Trash2, Search } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let schedulerRunning = $state(false);
	let schedulerResult = $state<'ok' | 'error' | null>(null);
	let clearingLogs = $state(false);

	async function runScheduler() {
		schedulerRunning = true;
		schedulerResult = null;
		try {
			const res = await fetch('/api/scheduler', { method: 'POST' });
			schedulerResult = res.ok ? 'ok' : 'error';
		} catch {
			schedulerResult = 'error';
		} finally {
			schedulerRunning = false;
		}
	}

	async function clearReminderLogs() {
		clearingLogs = true;
		try {
			await fetch('/api/scheduler/logs', { method: 'DELETE' });
		} finally {
			clearingLogs = false;
		}
	}

	let search = $state('');
	let filterStatus = $state<string[]>([]);
	let filterMember = $state<string[]>([]);
	let filterPeriod = $state<'week' | 'month' | 'all'>('week');
	let sortDeadline = $state<'asc' | 'desc' | null>(null);

	function periodBounds(period: 'week' | 'month' | 'all'): { start: Date; end: Date } | null {
		if (period === 'all') return null;
		const now = new Date();
		if (period === 'week') {
			const day = now.getDay();
			const monday = new Date(now);
			monday.setDate(now.getDate() - ((day + 6) % 7));
			monday.setHours(0, 0, 0, 0);
			const sunday = new Date(monday);
			sunday.setDate(monday.getDate() + 6);
			sunday.setHours(23, 59, 59, 999);
			return { start: monday, end: sunday };
		}
		const start = new Date(now.getFullYear(), now.getMonth(), 1);
		const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
		return { start, end };
	}

	const periodLabels: Record<string, string> = { week: 'This week', month: 'This month', all: 'All' };

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

	const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({ value, label }));

	const memberOptions = $derived(data.members.map((m) => ({ value: m.id, label: m.name })));

	const filtered = $derived.by(() => {
		const bounds = periodBounds(filterPeriod);
		const result = data.tasks.filter((t) => {
			if (filterStatus.length && !filterStatus.includes(t.status)) return false;
			if (filterMember.length && !filterMember.includes(t.assignedTo)) return false;
			if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
			if (bounds) {
				if (!t.deadlineDate) return false;
				const d = new Date(t.deadlineDate).getTime();
				if (d < bounds.start.getTime() || d > bounds.end.getTime()) return false;
			}
			return true;
		});
		if (sortDeadline) {
			result.sort((a, b) => {
				const da = a.deadlineDate ? new Date(a.deadlineDate).getTime() : Infinity;
				const db = b.deadlineDate ? new Date(b.deadlineDate).getTime() : Infinity;
				return sortDeadline === 'asc' ? da - db : db - da;
			});
		}
		return result;
	});

	const counts = $derived.by(() => {
		const c = { pending: 0, in_progress: 0, done: 0, overdue: 0, problem: 0 };
		for (const t of data.tasks) {
			if (t.status in c) c[t.status as keyof typeof c]++;
		}
		return c;
	});

	const hasFilters = $derived(
		filterStatus.length > 0 || filterMember.length > 0 || !!search || filterPeriod !== 'week'
	);

	function clearFilters() {
		filterStatus = [];
		filterMember = [];
		search = '';
		filterPeriod = 'week';
	}

	function formatDate(d: Date | null) {
		if (!d) return '—';
		const dt = new Date(d);
		const date = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
		const time = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
		return `${date}, ${time}`;
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
			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					onclick={clearReminderLogs}
					disabled={clearingLogs}
					class="gap-1.5"
				>
					<Trash2 class="size-3.5" />
					{clearingLogs ? 'Clearing…' : 'Clear reminder logs'}
				</Button>
				<Button
					variant="outline"
					size="sm"
					onclick={runScheduler}
					disabled={schedulerRunning}
					class="gap-1.5 {schedulerResult === 'ok' ? 'border-green-500 text-green-600' : schedulerResult === 'error' ? 'border-red-500 text-red-600' : ''}"
				>
					<Play class="size-3.5" />
					{schedulerRunning ? 'Running…' : schedulerResult === 'ok' ? 'Done' : schedulerResult === 'error' ? 'Error' : 'Run scheduler'}
				</Button>
				<Button href="/tasks/new" class="gap-1.5">
					<Plus class="size-4" />
					New Task
				</Button>
			</div>
		{/if}
	</div>

	<!-- Counters -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		{#each Object.entries(counts) as [status, count]}
			<button
				onclick={() => {
					filterStatus = filterStatus.includes(status)
						? filterStatus.filter((s) => s !== status)
						: [...filterStatus, status];
				}}
				class="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent
					{filterStatus.includes(status) ? 'ring-2 ring-ring' : ''}"
			>
				<p class="text-[0.75rem] font-medium text-muted-foreground uppercase tracking-wide">
					{statusLabels[status]}
				</p>
				<p class="mt-1 text-[1.5rem] font-bold">{count}</p>
			</button>
		{/each}
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap items-center gap-3">
		<div class="relative">
			<Search class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
			<input
				bind:value={search}
				placeholder="Search tasks…"
				class="rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-[0.875rem] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-48"
			/>
		</div>

		<Select.Root bind:value={filterPeriod}>
			<Select.Trigger>
				<Select.Value label={periodLabels[filterPeriod]} />
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="week">This week</Select.Item>
				<Select.Item value="month">This month</Select.Item>
				<Select.Item value="all">All</Select.Item>
			</Select.Content>
		</Select.Root>

		<FacetedFilter label="Status" options={statusOptions} bind:selected={filterStatus} />

		{#if data.user.role === 'admin' && data.members.length > 0}
			<FacetedFilter label="Member" options={memberOptions} bind:selected={filterMember} />
		{/if}

		{#if hasFilters}
			<button
				onclick={clearFilters}
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
				{#if hasFilters}
					<p class="text-[0.875rem]">{data.tasks.length} task{data.tasks.length === 1 ? '' : 's'} hidden by filters</p>
					<Button variant="outline" size="sm" onclick={clearFilters}>
						Clear filters
					</Button>
				{:else}
					<p class="text-[0.875rem]">No tasks found.</p>
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
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
						<th
							class="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground"
							onclick={() => (sortDeadline = sortDeadline === 'asc' ? 'desc' : sortDeadline === 'desc' ? null : 'asc')}
						>
							Deadline {sortDeadline === 'asc' ? '↑' : sortDeadline === 'desc' ? '↓' : '↕'}
						</th>
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
