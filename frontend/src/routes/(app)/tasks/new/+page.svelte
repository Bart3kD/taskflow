<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import TaskForm from '$lib/components/TaskForm.svelte';

	let { data }: { data: PageData } = $props();
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit(payload: Record<string, unknown>) {
		loading = true;
		error = '';
		const res = await fetch('/api/tasks', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		loading = false;
		if (res.ok) {
			const task = await res.json();
			goto(`/tasks/${task.id}`);
		} else {
			const msg = await res.text().catch(() => 'Unknown error');
			error = msg;
		}
	}
</script>

<div class="max-w-2xl space-y-6">
	<div class="flex items-center gap-3">
		<a href="/tasks" class="text-[0.875rem] text-muted-foreground hover:text-foreground">← Tasks</a>
		<h1 class="text-[1.5rem] font-bold">New Task</h1>
	</div>

	{#if error}
		<p class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-[0.875rem] text-destructive">
			{error}
		</p>
	{/if}

	<TaskForm members={data.members} {loading} onsubmit={handleSubmit} />
</div>
