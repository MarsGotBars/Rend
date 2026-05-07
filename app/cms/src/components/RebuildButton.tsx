'use client'

import { useEffect, useState } from 'react'

type BuildStatus = 'idle' | 'started' | 'building' | 'done' | 'error'

export function RebuildButton() {
	const [status, setStatus] = useState<BuildStatus>('idle')

	// Poll the rebuild route while a build is in progress
	useEffect(() => {
		if (status !== 'started' && status !== 'building') return

		const interval = setInterval(async () => {
			try {
				const res = await fetch('/api/rebuild')
				const data = await res.json()
				if (!data.isRebuilding) {
					setStatus('done')
					clearInterval(interval)
					// Reset to idle after 3 s so the button is usable again
					setTimeout(() => setStatus('idle'), 3000)
				} else {
					setStatus('building')
				}
			} catch {
				setStatus('error')
				clearInterval(interval)
			}
		}, 2000)

		return () => clearInterval(interval)
	}, [status])

	async function handleClick() {
		if (status === 'started' || status === 'building') return
		setStatus('started')
		try {
			const res = await fetch('/api/rebuild', { method: 'POST' })
			if (res.status === 409) {
				// Already building — sync state with server
				setStatus('building')
			}
		} catch {
			setStatus('error')
			setTimeout(() => setStatus('idle'), 3000)
		}
	}

	const label: Record<BuildStatus, string> = {
		idle: 'Rebuild & Reload Frontend',
		started: 'Starting…',
		building: 'Building…',
		done: 'Reloaded! Changes Live',
		error: 'Build Failed',
	}

	const disabled = status === 'started' || status === 'building'

	return (
		<button
			onClick={handleClick}
			disabled={disabled}
			style={{
				padding: '8px 16px',
				borderRadius: '4px',
				border: 'none',
				cursor: disabled ? 'not-allowed' : 'pointer',
				fontWeight: 600,
				fontSize: '13px',
				background:
					status === 'done'
						? '#22c55e'
						: status === 'error'
							? '#ef4444'
							: disabled
								? '#6b7280'
								: '#3b82f6',
				color: '#fff',
				opacity: disabled ? 0.7 : 1,
				transition: 'background 0.2s, opacity 0.2s',
			}}
		>
			{label[status]}
		</button>
	)
}
