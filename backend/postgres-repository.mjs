// Accepts a trusted PostgreSQL pool implementing query(sql, parameters).
export function postgresRepository(pool){
 if(typeof pool?.query!=='function')throw new TypeError('Database pool required');
 return {
 async accountBySubject(subject){const {rows}=await pool.query('SELECT id FROM accounts WHERE auth_subject = $1',[subject]);return rows[0]||null;},
 async subscriptionByAccount(id){const {rows}=await pool.query('SELECT plan,status,expires_at FROM subscriptions WHERE account_id = $1',[id]);const row=rows[0];return row?{plan:row.plan,status:row.status,expiresAt:new Date(row.expires_at).getTime()}:null;},
 async listPractitioners(){const {rows}=await pool.query("SELECT display_name,registration_authority,verification_status FROM practitioner_profiles WHERE verification_status = 'verified' AND verified_at IS NOT NULL ORDER BY display_name LIMIT 100");return rows.map(r=>({displayName:r.display_name,registrationAuthority:r.registration_authority,verificationStatus:r.verification_status}));}
 };
}
