'use client';
import { useEffect, useState } from 'react';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { useOwnerAuth } from '@/lib/hooks/useOwnerAuth';
import { ownerAPI } from '@/lib/api/owner-client';
export default function AnalyticsPage(){const {isLoading,isOwner,user}=useOwnerAuth();const [stats,setStats]=useState<any>();const [error,setError]=useState('');useEffect(()=>{if(isOwner)ownerAPI.getDashboardStats().then(setStats).catch(e=>setError(e.message));},[isOwner]);if(isLoading)return <div style={{padding:32}}>Loading…</div>;if(!isOwner)return <div style={{padding:32}}>Unauthorized</div>;return <OwnerLayout user={user}><section><h1>Analytics</h1><p>Operational analytics from the owner API. Event-level charts can be added when the analytics aggregation endpoint is enabled.</p>{error&&<div role="alert">{error}</div>}<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,marginTop:20}}>{stats&&Object.entries(stats).map(([key,value])=><article key={key} style={{padding:18,borderRadius:16,background:'rgba(255,255,255,.78)'}}><strong>{String(value)}</strong><div>{key}</div></article>)}</div></section></OwnerLayout>}
