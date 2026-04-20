<script lang="ts">
	import type { PageData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import TaskForm from '$lib/components/TaskForm.svelte';
	import { Copy, Trash2 } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	let error = $state('');
	let loading = $state(false);
	let tokenUrl = $state('');
	let deleting = $state(false);

	async function handleSubmit(payload: Record<string, unknown>) {
		loading = true;
		error = '';
		const res = await fetch(`/api/tasks/${data.task.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		loading = false;
		if (res.ok) {
			await invalidateAll();
		} else {
			error = await res.text().catch(() => 'Failed to update task');
		}
	}

	async function generateToken() {
		const res = await fetch(`/api/tasks/${data.task.id}`, { method: 'POST' });
		if (res.ok) {
			const token = await res.json();
			tokenUrl = `${window.location.origin}/confirm/${token.token}`;
		}
	}

	async function deleteTask() {
		if (!confirm('Delete this task?')) return;
		deleting = true;
		await fetch(`/api/tasks/${data.task.id}`, { method: 'DELETE' });
		goto('/tasks');
	}

	function copyToken() {
		navigator.clipboard.writeText(tokenUrl);
	}
</script>

<div class="max-w-2xl space-y-6">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a href="/tasks" class="text-[0.875rem] text-muted-foreground hover:text-foreground">← Tasks</a>
			<h1 class="text-[1.5rem] font-bold">{data.task.title}</h1>
		</div>
		{#if data.user.role === 'admin'}
			<Button variant="destructive" onclick={deleteTask} disabled={deleting} class="gap-1.5">
				<Trash2 class="size-4" />
				Delete
			</Button>
		{/if}
	</div>

	{#if error}
		<p class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-[0.875rem] text-destructive">
			{error}
		</p>
	{/if}

	<TaskForm
		members={data.members.length ? data.members : [{ id: data.task.assignedTo, name: '—' }]}
		currentUserId={data.user.id}
		task={data.task}
		{loading}
		onsubmit={handleSubmit}
	/>

	{#if data.user.role === 'admin'}
		<div class="rounded-xl border border-border bg-card p-5 space-y-3">
			<h2 class="text-[0.875rem] font-semibold">Confirmation token</h2>
			<p class="text-[0.875rem] text-muted-foreground">
				Generate a one-time link so the employee can confirm their task status.
			</p>

			<Button variant="outline" onclick={generateToken} class="gap-1.5">
				Generate token link
			</Button>

			{#if tokenUrl}
				<div class="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
					<span class="flex-1 truncate font-mono text-[0.75rem]">{tokenUrl}</span>
					<button onclick={copyToken} class="shrink-0 text-muted-foreground hover:text-foreground">
						<Copy class="size-4" />
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>
