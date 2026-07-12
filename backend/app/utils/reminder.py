from datetime import date

from sqlalchemy.orm import Session

from app.models.drivers import Driver
from apscheduler.schedulers.background import BackgroundScheduler
from app.utils.send_mail import send_email
from app.core.database import get_db

def send_license_expiry_reminders():
    db = get_db()
    
    today = date.today()

    drivers = db.query(Driver).all()

    for driver in drivers:
        days_left = (driver.license_expiry_date - today).days

        if days_left > 1:
            subject = "Driver License Expiry Reminder"
            html_body = f"""
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Driving License Expiry Reminder</title>
                </head>
                <body style="margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fb;padding:40px 0;">
                        <tr>
                            <td align="center">
                                <table width="600" cellpadding="0" cellspacing="0"
                                    style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

                                    <!-- Header -->
                                    <tr>
                                        <td style="background:#2563eb;padding:28px;text-align:center;">
                                            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;">
                                                Driving License Expiry Reminder
                                            </h1>
                                        </td>
                                    </tr>

                                    <!-- Content -->
                                    <tr>
                                        <td style="padding:40px 36px;color:#374151;font-size:16px;line-height:1.7;">

                                            <p style="margin-top:0;">
                                                Hello <strong>{driver.full_name}</strong>,
                                            </p>

                                            <p>
                                                This is a reminder that your <strong>driving license</strong>
                                                is scheduled to expire soon.
                                            </p>

                                            <table width="100%" cellpadding="0" cellspacing="0"
                                                style="margin:30px 0;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;">
                                                <tr>
                                                    <td style="padding:18px;">
                                                        <table width="100%">
                                                            <tr>
                                                                <td style="padding:6px 0;color:#6b7280;">Expiry Date</td>
                                                                <td align="right">
                                                                    <strong>{driver.license_expiry_date:%d %b %Y}</strong>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="padding:6px 0;color:#6b7280;">Days Remaining</td>
                                                                <td align="right">
                                                                    <strong style="color:#dc2626;">{days_left} day{"s" if days_left != 1 else ""}</strong>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p>
                                                Please renew your license before the expiry date to avoid
                                                suspension and ensure uninterrupted driving eligibility.
                                            </p>

                                            <div style="margin:32px 0;text-align:center;">
                                                <span style="display:inline-block;padding:14px 28px;background:#2563eb;color:#ffffff;border-radius:6px;font-weight:600;">
                                                    Action Required
                                                </span>
                                            </div>

                                            <p style="margin-bottom:0;">
                                                If you have already renewed your license, please disregard
                                                this email and update your records with the administration.
                                            </p>

                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="background:#f9fafb;padding:24px;text-align:center;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">
                                            This is an automated reminder from
                                            <strong>TransitOps Fleet Management</strong>.<br>
                                            Please do not reply to this email.
                                        </td>
                                    </tr>

                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            """

        elif days_left == 1:
            subject = "Driver License Expires Tomorrow"
            html_body = f"""
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Driving License Expires Tomorrow</title>
                </head>
                <body style="margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fb;padding:40px 0;">
                        <tr>
                            <td align="center">
                                <table width="600" cellpadding="0" cellspacing="0"
                                    style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

                                    <!-- Header -->
                                    <tr>
                                        <td style="background:#dc2626;padding:28px;text-align:center;">
                                            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;">
                                                Driving License Expires Tomorrow
                                            </h1>
                                        </td>
                                    </tr>

                                    <!-- Content -->
                                    <tr>
                                        <td style="padding:40px 36px;color:#374151;font-size:16px;line-height:1.7;">

                                            <p style="margin-top:0;">
                                                Hello <strong>{driver.full_name}</strong>,
                                            </p>

                                            <p>
                                                This is an urgent reminder that your <strong>driving license
                                                will expire tomorrow</strong>.
                                            </p>

                                            <table width="100%" cellpadding="0" cellspacing="0"
                                                style="margin:30px 0;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
                                                <tr>
                                                    <td style="padding:18px;">
                                                        <table width="100%">
                                                            <tr>
                                                                <td style="padding:6px 0;color:#6b7280;">Expiry Date</td>
                                                                <td align="right">
                                                                    <strong>{driver.license_expiry_date:%d %b %Y}</strong>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="padding:6px 0;color:#6b7280;">Status</td>
                                                                <td align="right">
                                                                    <strong style="color:#dc2626;">Expires Tomorrow</strong>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p>
                                                Please complete the renewal process immediately to avoid
                                                suspension and ensure you remain eligible to operate company
                                                vehicles.
                                            </p>

                                            <div style="margin:32px 0;text-align:center;">
                                                <span style="display:inline-block;padding:14px 28px;background:#dc2626;color:#ffffff;border-radius:6px;font-weight:600;">
                                                    Immediate Action Required
                                                </span>
                                            </div>

                                            <p style="margin-bottom:0;">
                                                If you have already renewed your license, please disregard
                                                this email and update your records with the administration.
                                            </p>

                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="background:#f9fafb;padding:24px;text-align:center;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">
                                            This is an automated reminder from
                                            <strong>TransitOps Fleet Management</strong>.<br>
                                            Please do not reply to this email.
                                        </td>
                                    </tr>

                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            """

        elif days_left == 0:
            subject = "Driver License Expires Today"
            html_body = f"""
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Driving License Expires Today</title>
                </head>
                <body style="margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fb;padding:40px 0;">
                        <tr>
                            <td align="center">
                                <table width="600" cellpadding="0" cellspacing="0"
                                    style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

                                    <!-- Header -->
                                    <tr>
                                        <td style="background:#b91c1c;padding:28px;text-align:center;">
                                            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;">
                                                Driving License Expires Today
                                            </h1>
                                        </td>
                                    </tr>

                                    <!-- Content -->
                                    <tr>
                                        <td style="padding:40px 36px;color:#374151;font-size:16px;line-height:1.7;">

                                            <p style="margin-top:0;">
                                                Hello <strong>{driver.full_name}</strong>,
                                            </p>

                                            <p>
                                                Your <strong>driving license expires today</strong>.
                                                Immediate action is required to avoid suspension and ensure
                                                you remain eligible to operate company vehicles.
                                            </p>

                                            <table width="100%" cellpadding="0" cellspacing="0"
                                                style="margin:30px 0;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
                                                <tr>
                                                    <td style="padding:18px;">
                                                        <table width="100%">
                                                            <tr>
                                                                <td style="padding:6px 0;color:#6b7280;">Expiry Date</td>
                                                                <td align="right">
                                                                    <strong>{driver.license_expiry_date:%d %b %Y}</strong>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="padding:6px 0;color:#6b7280;">Status</td>
                                                                <td align="right">
                                                                    <strong style="color:#b91c1c;">Expires Today</strong>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p>
                                                Please renew your driving license immediately. Failure to do
                                                so may result in suspension from driving duties until a valid
                                                license is provided.
                                            </p>

                                            <div style="margin:32px 0;text-align:center;">
                                                <span style="display:inline-block;padding:14px 28px;background:#b91c1c;color:#ffffff;border-radius:6px;font-weight:600;">
                                                    Renew Immediately
                                                </span>
                                            </div>

                                            <p style="margin-bottom:0;">
                                                If you have already renewed your license, please disregard
                                                this email and update your records with the administration.
                                            </p>

                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="background:#f9fafb;padding:24px;text-align:center;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">
                                            This is an automated reminder from
                                            <strong>TransitOps Fleet Management</strong>.<br>
                                            Please do not reply to this email.
                                        </td>
                                    </tr>

                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            """

        else:
            subject = "Driver License Has Expired"
            html_body = f"""
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Driving License Has Expired</title>
                </head>
                <body style="margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fb;padding:40px 0;">
                        <tr>
                            <td align="center">
                                <table width="600" cellpadding="0" cellspacing="0"
                                    style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

                                    <!-- Header -->
                                    <tr>
                                        <td style="background:#991b1b;padding:28px;text-align:center;">
                                            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;">
                                                Driving License Has Expired
                                            </h1>
                                        </td>
                                    </tr>

                                    <!-- Content -->
                                    <tr>
                                        <td style="padding:40px 36px;color:#374151;font-size:16px;line-height:1.7;">

                                            <p style="margin-top:0;">
                                                Hello <strong>{driver.full_name}</strong>,
                                            </p>

                                            <p>
                                                Our records indicate that your <strong>driving license has expired</strong>.
                                                Please renew it as soon as possible to regain eligibility to
                                                operate company vehicles.
                                            </p>

                                            <table width="100%" cellpadding="0" cellspacing="0"
                                                style="margin:30px 0;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
                                                <tr>
                                                    <td style="padding:18px;">
                                                        <table width="100%">
                                                            <tr>
                                                                <td style="padding:6px 0;color:#6b7280;">Expiry Date</td>
                                                                <td align="right">
                                                                    <strong>{driver.license_expiry_date:%d %b %Y}</strong>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="padding:6px 0;color:#6b7280;">Expired</td>
                                                                <td align="right">
                                                                    <strong style="color:#991b1b;">
                                                                        {-days_left} day{"s" if -days_left != 1 else ""} ago
                                                                    </strong>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="padding:6px 0;color:#6b7280;">Status</td>
                                                                <td align="right">
                                                                    <strong style="color:#991b1b;">Expired</strong>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p>
                                                Until a valid license is renewed and recorded, you may not be
                                                permitted to perform driving duties. Please complete the
                                                renewal process immediately and inform the administration once
                                                your license has been updated.
                                            </p>

                                            <div style="margin:32px 0;text-align:center;">
                                                <span style="display:inline-block;padding:14px 28px;background:#991b1b;color:#ffffff;border-radius:6px;font-weight:600;">
                                                    License Renewal Required
                                                </span>
                                            </div>

                                            <p style="margin-bottom:0;">
                                                If you have already renewed your license, please disregard
                                                this email and update your records with the administration.
                                            </p>

                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="background:#f9fafb;padding:24px;text-align:center;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">
                                            This is an automated reminder from
                                            <strong>TransitOps Fleet Management</strong>.<br>
                                            Please do not reply to this email.
                                        </td>
                                    </tr>

                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            """

        send_email(
            to=driver.email,
            subject=subject,
            body=html_body,
        )


scheduler = BackgroundScheduler(timezone="UTC")


def start_scheduler():
    scheduler.add_job(
        send_license_expiry_reminders,
        trigger="cron",
        hour=9,
        minute=0,
        id="license_expiry_reminders",
        replace_existing=True,
    )

    scheduler.start()


def stop_scheduler():
    scheduler.shutdown(wait=False)