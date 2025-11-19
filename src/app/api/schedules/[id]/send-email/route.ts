import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/render';
import MeetingInvitationEmail from '@/emails/meeting-invitation';
import nodemailer from 'nodemailer';
import React from 'react';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { to, subject, schedule } = await request.json();

    if (!to || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Recipient email addresses are required',
        },
        { status: 400 }
      );
    }

    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          message: 'Schedule data is required',
        },
        { status: 400 }
      );
    }

    // Validate required schedule fields
    if (!schedule.title || !schedule.startDate || !schedule.endDate || !schedule.startTime || !schedule.endTime) {
      console.error('Missing required schedule fields:', {
        title: schedule.title,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      });
      return NextResponse.json(
        {
          success: false,
          message: 'Schedule data is incomplete. Required fields: title, startDate, endDate, startTime, endTime',
        },
        { status: 400 }
      );
    }

    // Render React Email template to HTML
    let emailHTML: string;
    try {
      // Create the React element
      const emailElement = React.createElement(MeetingInvitationEmail, { schedule });
      
      // Render to HTML - render is synchronous and returns a string
      const renderResult = render(emailElement);
      
      // Validate render result immediately
      if (process.env.NODE_ENV === 'development') {
        console.log('Render result type:', typeof renderResult);
      }
      
      // Handle both sync and async render
      if (renderResult instanceof Promise) {
        emailHTML = await renderResult;
      } else if (typeof renderResult === 'string') {
        emailHTML = renderResult;
      } else {
        // If it's not a string or promise, try to convert it
        console.error('Unexpected render result type:', typeof renderResult, renderResult);
        emailHTML = String(renderResult || '');
      }
      
      // Validate that we got a string, not an object
      if (typeof emailHTML !== 'string') {
        console.error('Render returned non-string after processing:', typeof emailHTML, emailHTML);
        throw new Error(`Render function returned ${typeof emailHTML} instead of string. Got: ${JSON.stringify(emailHTML)}`);
      }
      
      // Ensure HTML is not empty
      if (!emailHTML || emailHTML.trim().length === 0) {
        console.error('Render returned empty HTML');
        throw new Error('Render function returned empty HTML');
      }
      
      // Log for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('Email HTML rendered successfully, length:', emailHTML.length);
        console.log('HTML preview (first 200 chars):', emailHTML.substring(0, 200));
      }
    } catch (renderError: any) {
      console.error('Error rendering email template:', renderError);
      console.error('Render error stack:', renderError.stack);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to render email template',
          error: process.env.NODE_ENV === 'development' ? renderError.message : undefined,
          stack: process.env.NODE_ENV === 'development' ? renderError.stack : undefined,
        },
        { status: 500 }
      );
    }

    const emailSubject = subject || `Meeting Invitation: ${schedule.title}`;

    // Check if SMTP is configured
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        // Configure nodemailer transporter
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        // Send email to all recipients
        const mailOptions = {
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: to.join(', '),
          subject: emailSubject,
          html: emailHTML,
          // Also include plain text version as fallback
          text: `Meeting Invitation: ${schedule.title}\n\nDate: ${schedule.startDate} - ${schedule.endDate}\nTime: ${schedule.startTime} - ${schedule.endTime}\n${schedule.location ? `Location: ${schedule.location}\n` : ''}${schedule.agenda ? `\nAgenda: ${schedule.agenda}` : ''}`,
        };

        // Log email details in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Sending email with options:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            htmlLength: emailHTML.length,
          });
        }

        const info = await transporter.sendMail(mailOptions);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Email sent successfully:', info.messageId);
        }

        return NextResponse.json({
          success: true,
          message: `Email sent successfully to ${to.length} recipient(s)`,
          messageId: info.messageId,
        });
      } catch (emailError: any) {
        console.error('Error sending email via SMTP:', emailError);
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to send email. Please check SMTP configuration.',
            error: process.env.NODE_ENV === 'development' ? emailError.message : undefined,
            emailContent: {
              to,
              subject: emailSubject,
              html: emailHTML,
            },
          },
          { status: 500 }
        );
      }
    }

    // If SMTP is not configured, return email content
    // Ensure emailHTML is a string before returning
    const htmlString = typeof emailHTML === 'string' ? emailHTML : String(emailHTML || '');
    
    if (!htmlString || htmlString.trim().length === 0) {
      console.error('emailHTML is empty or invalid before returning:', typeof emailHTML, emailHTML);
      return NextResponse.json(
        {
          success: false,
          message: 'Email HTML content is invalid',
          error: 'Failed to generate email HTML',
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Email content generated. SMTP not configured.',
      emailContent: {
        to,
        subject: emailSubject,
        html: htmlString,
      },
    });
  } catch (error: any) {
    console.error('Error in send-email API:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process email request',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

