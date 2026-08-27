import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
export const AdminBankAccounts = () => { const [items,setItems]=useState([]); const load=()=>api.get('/bank-accounts/admin/all').then(r=>setItems(r.data.data)); useEffect(()=>{load();},[]); const action=(id,name)=>api.patch(`/bank-accounts/${id}/${name}`).then(load); return <div><div className="page-heading"><h1>Bank Verification</h1><p>Verify affiliate payout accounts before withdrawals.</p></div><Card>{items.map(a=><article className="bank-account-item" key={a.id}><div><strong>{a.bank_name} · {a.account_number}</strong><p>{a.account_holder_name} · {a.email}</p><small>{a.ifsc_code}</small></div><div className="bank-account-actions"><Badge status={a.verification_status}>{a.verification_status}</Badge>{a.verification_status==='PENDING'&&<><Button onClick={()=>action(a.id,'verify')}>Verify</Button><Button onClick={()=>action(a.id,'reject')}>Reject</Button></>}</div></article>)}</Card></div>; };
