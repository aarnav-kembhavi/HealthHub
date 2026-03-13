import SupaAuthVerifyEmail from "@/emails";
import supabaseAdmin from "@/lib/supabase/admin";
import { Resend } from "resend";

export async function POST(request: Request) {
	try {
		const adminKey = process.env.SUPABAE_ADMIN;
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
		if (!supabaseUrl || !adminKey || adminKey.startsWith("your_")) {
			return Response.json(
				{ error: { message: "Server misconfigured: Supabase admin key not set. Add SUPABAE_ADMIN (service role key) in .env.local." } },
				{ status: 500 }
			);
		}

		let data: { email?: string; password?: string };
		try {
			data = await request.json();
		} catch {
			return Response.json({ error: { message: "Invalid request body." } }, { status: 400 });
		}
		const supabase = supabaseAdmin();

		const res = await supabase.auth.admin.generateLink({
			type: "signup",
			email: data.email,
			password: data.password,
		});

		if (res.error) {
			return Response.json({ data: null, error: res.error }, { status: 400 });
		}

		if (res.data.properties?.email_otp) {
			const resendKey = process.env.RESEND_API_KEY;
			const resendDomain = process.env.RESEND_DOMAIN;
			if (!resendKey || !resendDomain) {
				// Return success but tell user to check Supabase email (magic link may have been sent by Supabase)
				return Response.json({
					data: null,
					error: {
						message:
							"Email service not configured. Add RESEND_API_KEY and RESEND_DOMAIN to .env.local to send verification emails. You can also check Supabase Auth for magic links.",
					},
				});
			}
			const resend = new Resend(resendKey);
			const resendRes = await resend.emails.send({
				from: `Acme <onboarding@${resendDomain}>`,
				to: [data.email],
				subject: "Verify Email",
				react: SupaAuthVerifyEmail({
					verificationCode: res.data.properties.email_otp,
				}),
			});
			return Response.json(resendRes);
		}

		return Response.json({ data: null, error: res.error }, { status: 400 });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Signup failed";
		return Response.json({ error: { message } }, { status: 500 });
	}
}
