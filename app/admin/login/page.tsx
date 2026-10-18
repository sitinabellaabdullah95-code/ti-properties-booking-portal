'use client';
import {T, LocalizedAttributes} from "../../../components/Language";
import Brand from '../../../components/Brand';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { publicDb } from '../../../lib/supabase';
export default function Login() { const router = useRouter(), [error, setError] = useState(''), [busy, setBusy] = useState(false); async function login(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); setBusy(true); const d = new FormData(e.currentTarget); try {
    const db = publicDb();
    const { error } = await db.auth.signInWithPassword({ email: String(d.get('email')), password: String(d.get('password')) });
    if (error)
        throw error;
    router.push('/admin');
}
catch (e) {
    setError('Log masuk gagal. Semak e-mel dan kata laluan anda.');
}
finally {
    setBusy(false);
} } return <main><Brand /><h1><T>{"Log masuk admin"}</T></h1><form className="panel" onSubmit={login}><label><T>{"E-mel"}</T></label><LocalizedAttributes><input aria-label="E-mel" autoComplete="username" type="email" name="email" required/></LocalizedAttributes><label><T>{"Kata laluan"}</T></label><LocalizedAttributes><input aria-label="Kata laluan" autoComplete="current-password" type="password" name="password" required/></LocalizedAttributes><T>{error && <p className="error"><T>{error}</T></p>}</T><button disabled={busy}><T>{"Log masuk"}</T></button></form></main>; }
