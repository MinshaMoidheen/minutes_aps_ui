import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

interface MeetingInvitationEmailProps {
  schedule: {
    title: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    location?: string;
    agenda?: string;
    meetingPoints?: Array<{
      pointsDiscussed?: string;
      planOfAction?: string;
      accountability?: string;
    }>;
    organizer?: string;
  };
}

export const MeetingInvitationEmail = ({ schedule }: MeetingInvitationEmailProps) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Html>
      <Head />
      <Preview>Meeting Invitation: {schedule.title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Meeting Invitation</Heading>
          
          <Section style={section}>
            <Heading style={h2}>{schedule.title}</Heading>
            
            <Text style={text}>
              <strong>Date:</strong> {formatDate(schedule.startDate)}
              {schedule.startDate !== schedule.endDate && ` - ${formatDate(schedule.endDate)}`}
            </Text>
            
            <Text style={text}>
              <strong>Time:</strong> {schedule.startTime} - {schedule.endTime}
            </Text>
            
            {schedule.location && (
              <Text style={text}>
                <strong>Location:</strong> {schedule.location}
              </Text>
            )}
            
            {schedule.organizer && (
              <Text style={text}>
                <strong>Organizer:</strong> {schedule.organizer}
              </Text>
            )}
          </Section>

          {schedule.agenda && (
            <Section style={section}>
              <Heading style={h3}>Agenda</Heading>
              <Text style={text}>{schedule.agenda}</Text>
            </Section>
          )}

          {schedule.meetingPoints && schedule.meetingPoints.length > 0 && (
            <Section style={section}>
              <Heading style={h3}>Meeting Points</Heading>
              {schedule.meetingPoints.map((point, index) => (
                <Section key={index} style={meetingPoint}>
                  <Text style={pointNumber}>{index + 1}. {point.pointsDiscussed || 'N/A'}</Text>
                  {point.planOfAction && (
                    <Text style={pointDetail}>
                      <strong>Plan of Action:</strong> {point.planOfAction}
                    </Text>
                  )}
                  {point.accountability && (
                    <Text style={pointDetail}>
                      <strong>Accountability:</strong>{' '}
                      {point.accountability === 'admin'
                        ? 'Admin'
                        : point.accountability.startsWith('client:')
                        ? 'Client'
                        : point.accountability}
                    </Text>
                  )}
                </Section>
              ))}
            </Section>
          )}
        </Container>
      </Body>
    </Html>
  );
};

export default MeetingInvitationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 20px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '30px 0 20px',
  padding: '0',
};

const h3 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '20px 0 10px',
  padding: '0',
};

const section = {
  padding: '0 48px',
  marginBottom: '20px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '10px 0',
};

const meetingPoint = {
  marginBottom: '20px',
  padding: '15px',
  backgroundColor: '#f9fafb',
  borderRadius: '4px',
};

const pointNumber = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 10px 0',
};

const pointDetail = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '5px 0',
  paddingLeft: '20px',
};


