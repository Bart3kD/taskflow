<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { data }: { data: PageData } = $props();

	let step = $state<1 | 2 | 3>(1);

	// Step 1 — password
	let newPassword = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let passwordError = $state('');

	// Step 2 — Telegram
	let telegramLinkUrl = $state('');
	let telegramLinkLoading = $state(false);
	let telegramLinkCopied = $state(false);
	let telegramConnected = $state(untrack(() => !!data.user.telegramChatId));
	let telegramCheckLoading = $state(false);

	// Step 3 — avatar
	let avatarDataUrl = $state<string | null>(null);
	let avatarError = $state('');
	let avatarDragging = $state(false);

	// Submission
	let submitting = $state(false);
	let submitError = $state('');

	function validatePassword(): boolean {
		if (newPassword.length < 8) {
			passwordError = 'Password must be at least 8 characters.';
			return false;
		}
		if (newPassword !== confirmPassword) {
			passwordError = 'Passwords do not match.';
			return false;
		}
		passwordError = '';
		return true;
	}

	function goNext() {
		if (step === 1 && !validatePassword()) return;
		if (step < 3) step = (step + 1) as 2 | 3;
	}

	function goBack() {
		if (step > 1) step = (step - 1) as 1 | 2;
	}

	async function generateTelegramLink() {
		telegramLinkLoading = true;
		const res = await fetch('/api/telegram/link', { method: 'POST' });
		telegramLinkLoading = false;
		if (res.ok) {
			const { url } = await res.json();
			telegramLinkUrl = url;
		}
	}

	function copyTelegramLink() {
		navigator.clipboard.writeText(telegramLinkUrl);
		telegramLinkCopied = true;
		setTimeout(() => (telegramLinkCopied = false), 2000);
	}

	async function checkTelegramConnection() {
		telegramCheckLoading = true;
		const res = await fetch(`/api/users/${data.user.id}`);
		telegramCheckLoading = false;
		if (res.ok) {
			const user = await res.json();
			telegramConnected = !!user.telegramChatId;
		}
	}

	function resizeImage(file: File, maxPx: number): Promise<string> {
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const img = new Image();
				img.onload = () => {
					const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
					const canvas = document.createElement('canvas');
					canvas.width = Math.round(img.width * ratio);
					canvas.height = Math.round(img.height * ratio);
					canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
					resolve(canvas.toDataURL('image/jpeg', 0.85));
				};
				img.src = e.target!.result as string;
			};
			reader.readAsDataURL(file);
		});
	}

	async function processFile(file: File) {
		if (!file.type.startsWith('image/')) {
			avatarError = 'Please select an image file.';
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			avatarError = 'File must be under 5 MB.';
			return;
		}
		avatarError = '';
		avatarDataUrl = await resizeImage(file, 256);
	}

	function handleFileInput(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) processFile(file);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		avatarDragging = false;
		const file = e.dataTransfer?.files[0];
		if (file) processFile(file);
	}

	function triggerFilePicker() {
		document.getElementById('avatar-input')?.click();
	}

	async function completeSetup() {
		if (!validatePassword()) {
			step = 1;
			return;
		}
		submitting = true;
		submitError = '';

		const res = await fetch('/api/onboarding', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ newPassword, avatarUrl: avatarDataUrl })
		});

		submitting = false;

		if (!res.ok) {
			submitError = 'Something went wrong. Please try again.';
			return;
		}

		goto('/dashboard');
	}

	function initials(name: string): string {
		return name
			.split(' ')
			.map((w) => w[0] ?? '')
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}

	const steps = [
		{ label: 'Password', hint: 'Required' },
		{ label: 'Telegram', hint: 'Optional' },
		{ label: 'Picture', hint: 'Optional' }
	];
</script>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
	<div class="w-full max-w-[480px]">
		<!-- Brand + welcome -->
		<div class="text-center mb-10">
			<p class="text-[1rem] font-bold text-foreground tracking-tight mb-6">TaskFlow</p>
			<h1 class="text-[1.625rem] font-bold text-foreground leading-tight">
				Welcome, {data.user.name}!
			</h1>
			<p class="text-[0.875rem] text-muted-foreground mt-1.5">
				Let's set up your account before you get started.
			</p>
		</div>

		<!-- Step indicator -->
		<div class="flex items-start justify-center gap-0 mb-8">
			{#each steps as s, i}
				{@const n = i + 1}
				{#if i > 0}
					<div
						class="h-px w-10 mt-4 mx-1 transition-colors duration-300 {step > n
							? 'bg-primary'
							: 'bg-border'}"
					></div>
				{/if}
				<div class="flex flex-col items-center gap-1.5 min-w-[56px]">
					<div
						class="size-8 rounded-full flex items-center justify-center text-[0.75rem] font-semibold transition-all duration-300
							{step > n
							? 'bg-primary text-primary-foreground'
							: step === n
							? 'bg-primary text-primary-foreground ring-[3px] ring-primary/20'
							: 'bg-muted text-muted-foreground border border-border'}"
					>
						{#if step > n}
							<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
								<path d="M20 6L9 17l-5-5" />
							</svg>
						{:else}
							{n}
						{/if}
					</div>
					<span class="text-[0.6875rem] font-medium leading-none {step === n ? 'text-foreground' : 'text-muted-foreground'}">{s.label}</span>
					<span class="text-[0.625rem] text-muted-foreground/60 leading-none">{s.hint}</span>
				</div>
			{/each}
		</div>

		<!-- Card -->
		<div class="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
			<!-- Step 1: Password -->
			{#if step === 1}
				<div class="p-8 space-y-6">
					<div>
						<h2 class="text-[1.0625rem] font-semibold text-foreground">Set your password</h2>
						<p class="text-[0.8125rem] text-muted-foreground mt-1">
							Choose a secure password to protect your account.
						</p>
					</div>

					<div class="space-y-4">
						<div class="space-y-1.5">
							<Label for="new-password" class="text-[0.8125rem]">New password</Label>
							<Input
								id="new-password"
								type={showPassword ? 'text' : 'password'}
								placeholder="At least 8 characters"
								bind:value={newPassword}
								autocomplete="new-password"
								onkeydown={(e) => e.key === 'Enter' && goNext()}
							/>
						</div>

						<div class="space-y-1.5">
							<Label for="confirm-password" class="text-[0.8125rem]">Confirm password</Label>
							<Input
								id="confirm-password"
								type={showPassword ? 'text' : 'password'}
								placeholder="Repeat your password"
								bind:value={confirmPassword}
								autocomplete="new-password"
								onkeydown={(e) => e.key === 'Enter' && goNext()}
							/>
						</div>

						<label class="flex items-center gap-2 cursor-pointer select-none w-fit">
							<input
								type="checkbox"
								bind:checked={showPassword}
								class="size-3.5 rounded"
							/>
							<span class="text-[0.8125rem] text-muted-foreground">Show passwords</span>
						</label>

						{#if passwordError}
							<p class="text-[0.8125rem] text-destructive">{passwordError}</p>
						{/if}
					</div>

					<div class="flex justify-end pt-1">
						<Button onclick={goNext} disabled={!newPassword || !confirmPassword}>
							Next
							<svg class="ml-1.5 size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M5 12h14M12 5l7 7-7 7" />
							</svg>
						</Button>
					</div>
				</div>

			<!-- Step 2: Telegram -->
			{:else if step === 2}
				<div class="p-8 space-y-6">
					<div>
						<h2 class="text-[1.0625rem] font-semibold text-foreground">Connect Telegram</h2>
						<p class="text-[0.8125rem] text-muted-foreground mt-1">
							Receive task reminders and status reports via Telegram. You can skip this and set it up later.
						</p>
					</div>

					<div class="space-y-3">
						<!-- Status row -->
						<div class="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
							<div class="flex items-center gap-2.5">
								{#if telegramConnected}
									<span class="relative flex size-2.5">
										<span class="animate-ping absolute inline-flex size-full rounded-full bg-[var(--color-status-green)] opacity-75"></span>
										<span class="relative inline-flex rounded-full size-2.5 bg-[var(--color-status-green)]"></span>
									</span>
									<span class="text-[0.875rem] font-medium text-foreground">Connected</span>
								{:else}
									<span class="size-2.5 rounded-full bg-muted-foreground/30 shrink-0"></span>
									<span class="text-[0.875rem] text-muted-foreground">Not connected</span>
								{/if}
							</div>
							{#if !telegramConnected}
								<Button
									variant="outline"
									size="sm"
									onclick={checkTelegramConnection}
									disabled={telegramCheckLoading}
								>
									{telegramCheckLoading ? 'Checking…' : 'Check status'}
								</Button>
							{/if}
						</div>

						{#if !telegramConnected}
							{#if !telegramLinkUrl}
								<Button
									variant="outline"
									class="w-full"
									onclick={generateTelegramLink}
									disabled={telegramLinkLoading}
								>
									{telegramLinkLoading ? 'Generating…' : 'Generate Telegram link'}
								</Button>
							{:else}
								<div class="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
									<p class="text-[0.75rem] text-muted-foreground leading-relaxed">
										Click the link to open Telegram and start the bot. Your account connects automatically.
									</p>
									<div class="flex items-center gap-2 rounded-lg bg-background border border-border px-3 py-2">
										<code class="flex-1 truncate text-[0.75rem] text-foreground">{telegramLinkUrl}</code>
										<button
											type="button"
											onclick={copyTelegramLink}
											class="shrink-0 text-[0.75rem] font-medium text-primary hover:text-primary/70 transition-colors"
										>
											{telegramLinkCopied ? '✓ Copied' : 'Copy'}
										</button>
									</div>
									<a
										href={telegramLinkUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="flex items-center justify-center gap-1.5 w-full rounded-lg border border-border bg-background hover:bg-muted/50 text-[0.8125rem] font-medium py-2 px-4 transition-colors"
									>
										Open in Telegram
										<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
											<polyline points="15 3 21 3 21 9" />
											<line x1="10" y1="14" x2="21" y2="3" />
										</svg>
									</a>
								</div>
							{/if}
						{/if}
					</div>

					<div class="flex items-center justify-between pt-1">
						<button
							type="button"
							onclick={goBack}
							class="text-[0.8125rem] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
						>
							<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M19 12H5M12 19l-7-7 7-7" />
							</svg>
							Back
						</button>
						<Button onclick={goNext}>
							{telegramConnected ? 'Continue' : 'Skip for now'}
							<svg class="ml-1.5 size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M5 12h14M12 5l7 7-7 7" />
							</svg>
						</Button>
					</div>
				</div>

			<!-- Step 3: Profile picture -->
			{:else}
				<div class="p-8 space-y-6">
					<div>
						<h2 class="text-[1.0625rem] font-semibold text-foreground">Add a profile picture</h2>
						<p class="text-[0.8125rem] text-muted-foreground mt-1">
							Helps your teammates recognise you. You can change it any time in settings.
						</p>
					</div>

					<div class="flex flex-col items-center gap-4">
						<!-- Avatar circle -->
						<button
							type="button"
							class="relative size-28 rounded-full overflow-hidden ring-2 ring-border cursor-pointer group focus:outline-none focus:ring-primary transition-all"
							onclick={triggerFilePicker}
							ondragover={(e) => { e.preventDefault(); avatarDragging = true; }}
							ondragleave={() => (avatarDragging = false)}
							ondrop={handleDrop}
							aria-label="Upload profile picture"
						>
							{#if avatarDataUrl}
								<img src={avatarDataUrl} alt="Profile preview" class="size-full object-cover" />
							{:else}
								<div class="size-full bg-primary/10 flex items-center justify-center">
									<span class="text-primary text-[1.625rem] font-bold select-none">{initials(data.user.name)}</span>
								</div>
							{/if}
							<div
								class="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-150
									{avatarDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}"
							>
								<svg class="size-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
									<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
									<polyline points="17 8 12 3 7 8" />
									<line x1="12" y1="3" x2="12" y2="15" />
								</svg>
							</div>
						</button>

						<input
							id="avatar-input"
							type="file"
							accept="image/*"
							class="hidden"
							onchange={handleFileInput}
						/>

						<div class="flex items-center gap-2 text-[0.8125rem]">
							<button
								type="button"
								onclick={triggerFilePicker}
								class="text-primary hover:text-primary/70 font-medium transition-colors"
							>
								{avatarDataUrl ? 'Change photo' : 'Upload photo'}
							</button>
							{#if avatarDataUrl}
								<span class="text-muted-foreground">·</span>
								<button
									type="button"
									onclick={() => (avatarDataUrl = null)}
									class="text-muted-foreground hover:text-destructive transition-colors"
								>
									Remove
								</button>
							{/if}
						</div>

						{#if avatarError}
							<p class="text-[0.8125rem] text-destructive text-center">{avatarError}</p>
						{:else}
							<p class="text-[0.75rem] text-muted-foreground text-center">
								JPG, PNG or WebP · max 5 MB · automatically resized to 256 × 256
							</p>
						{/if}
					</div>

					{#if submitError}
						<p class="text-[0.8125rem] text-destructive text-center">{submitError}</p>
					{/if}

					<div class="flex items-center justify-between pt-1">
						<button
							type="button"
							onclick={goBack}
							class="text-[0.8125rem] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
						>
							<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M19 12H5M12 19l-7-7 7-7" />
							</svg>
							Back
						</button>
						<Button onclick={completeSetup} disabled={submitting}>
							{submitting ? 'Setting up…' : 'Complete setup'}
						</Button>
					</div>
				</div>
			{/if}
		</div>

		<p class="text-center text-[0.75rem] text-muted-foreground mt-6">
			Need help? Contact your administrator.
		</p>
	</div>
</div>
