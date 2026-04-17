<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type StatusChoice = 'done' | 'in_progress' | 'problem';

	let submitted = $state(false);
	let chosen = $state<StatusChoice | null>(null);
	let loading = $state(false);
	let errorMsg = $state('');

	const options: { value: StatusChoice; label: string; description: string; color: string }[] = [
		{
			value: 'done',
			label: 'Done',
			description: 'The task has been completed.',
			color: 'border-green-500 bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/40'
		},
		{
			value: 'in_progress',
			label: 'In Progress',
			description: 'I am working on it.',
			color: 'border-blue-500 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40'
		},
		{
			value: 'problem',
			label: 'Problem',
			description: 'There is an issue I need help with.',
			color: 'border-yellow-500 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/20 dark:hover:bg-yellow-950/40'
		}
	];

	async function confirm(status: StatusChoice) {
		loading = true;
		chosen = status;
		errorMsg = '';

		try {
			const res = await fetch(`/api/status/${data.token}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status })
			});

			if (res.ok) {
				submitted = true;
			} else {
				const body = await res.json().catch(() => ({ message: 'Unknown error' }));
				errorMsg = body.message ?? 'Unknown error';
				chosen = null;
			}
		} catch {
			errorMsg = 'Network error — please try again.';
			chosen = null;
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-background px-4">
	<div class="w-full max-w-md space-y-6">
		<div class="text-center">
			<h1 class="text-[1.5rem] font-bold">Task Status Update</h1>
			<p class="mt-1 text-[0.875rem] text-muted-foreground">for: <strong>{data.task.title}</strong></p>
		</div>

		{#if data.confirmed || submitted}
			<div class="rounded-xl border border-green-300 bg-green-50 p-6 text-center dark:bg-green-950/20">
				<p class="text-[1.25rem] font-semibold text-green-800 dark:text-green-300">✓ Thank you!</p>
				<p class="mt-1 text-[0.875rem] text-green-700 dark:text-green-400">
					Your status has been recorded.
				</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each options as opt}
					<button
						onclick={() => confirm(opt.value)}
						disabled={loading}
						class="w-full rounded-xl border-2 p-4 text-left transition-all disabled:opacity-50 {opt.color}
							{chosen === opt.value ? 'ring-2 ring-offset-1 ring-ring' : ''}"
					>
						<p class="text-[1rem] font-semibold">{opt.label}</p>
						<p class="text-[0.875rem] text-muted-foreground">{opt.description}</p>
					</button>
				{/each}
			</div>

			{#if errorMsg}
				<p class="text-center text-[0.875rem] text-destructive">{errorMsg}</p>
			{/if}
		{/if}
	</div>
</div>
