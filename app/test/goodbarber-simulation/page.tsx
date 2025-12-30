'use client';

import { useState, useEffect } from 'react';

// Mock GoodBarber Object
// In real app, this is injected by the native shell.
// We mocked it on window.
declare global {
    interface Window {
        gb: any;
    }
}

export default function GoodBarberSimulation() {
    const [logs, setLogs] = useState<string[]>([]);
    const [status, setStatus] = useState<string>('Ready');

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1]} - ${msg}`]);

    useEffect(() => {
        // Setup Mock GB Environment
        window.gb = {
            user: {
                getCurrent: (callback: (user: any) => void) => {
                    // Simulate fetching user
                    setTimeout(() => {
                        callback({
                            username: 'Juan Perez (Afiliado Demo)',
                            email: 'juan.perez@demo.com'
                        });
                    }, 500);
                }
            },
            onappear: null // Simulate the hook
        };

        addLog('GoodBarber Mock SDK initialized.');

        // Run the script logic "getUser"
        getUser();
    }, []);

    // ---------------------------------------------------------
    // THE SCRIPT LOGIC (Matches user request requirements)
    // ---------------------------------------------------------

    function getUser() {
        if (typeof window.gb === 'undefined' || !window.gb.user || !window.gb.user.getCurrent) {
            console.warn("GB API not loaded. Using placeholders.");
            addLog('GB API not loaded?');
            return;
        }
        window.gb.user.getCurrent((user: any) => {
            if (user) {
                addLog(`User User found: ${user.username}`);
                (document.getElementById('name_input') as HTMLInputElement).value = user.username || '';
                (document.getElementById('mail_input') as HTMLInputElement).value = user.email || '';
            }
        });
    }

    async function submitForm(event: React.FormEvent) {
        event.preventDefault();
        setStatus('Sending...');
        const name = (document.getElementById('name_input') as HTMLInputElement).value;
        const email = (document.getElementById('mail_input') as HTMLInputElement).value;
        const comment = (document.getElementById('comment_textarea') as HTMLTextAreaElement).value;

        addLog(`Submitting Ticket... Name: ${name}`);

        try {
            const response = await fetch('/api/webhooks/create-ticket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, comment })
            });

            const data = await response.json();

            if (response.ok) {
                addLog(`Success! Ticket #${data.ticket_number}`);
                setStatus(`Success! Ticket #${data.ticket_number} Created.`);
                (document.getElementById('comment_textarea') as HTMLTextAreaElement).value = '';
            } else {
                addLog(`Error: ${data.error}`);
                setStatus(`Error: ${data.error}`);
            }
        } catch (err: any) {
            addLog(`Network Error: ${err.message}`);
            setStatus('Network Error');
        }
    }

    return (
        <div className="p-8 max-w-2xl mx-auto bg-gray-100 min-h-screen font-sans">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">GoodBarber Custom Code Simulation</h1>

            <div className="bg-white p-6 rounded shadow mb-8">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">Support Form (Embedded)</h2>

                <form onSubmit={submitForm} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre</label>
                        <input id="name_input" type="text" className="mt-1 block w-full border border-gray-300 rounded p-2 text-gray-900" placeholder="Your Name" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input id="mail_input" type="email" className="mt-1 block w-full border border-gray-300 rounded p-2 text-gray-900" placeholder="email@example.com" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Mensaje / Solicitud</label>
                        <textarea id="comment_textarea" className="mt-1 block w-full border border-gray-300 rounded p-2 text-gray-900 h-32" required placeholder="Describe your issue..."></textarea>
                    </div>

                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full font-semibold">
                        Enviar Ticket
                    </button>
                </form>

                <div className="mt-4 p-2 bg-gray-50 text-center font-mono text-sm border rounded">
                    Status: <span className="font-bold">{status}</span>
                </div>
            </div>

            <div className="bg-black text-green-400 p-4 rounded font-mono text-xs h-64 overflow-y-auto">
                <h3 className="text-white border-b border-gray-700 pb-2 mb-2">Debug Console</h3>
                {logs.map((L, i) => <div key={i}>{L}</div>)}
            </div>
        </div>
    );
}
