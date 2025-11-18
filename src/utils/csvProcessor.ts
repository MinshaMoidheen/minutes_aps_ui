// CSV Processing Utilities for Import Functionality

export interface AttendeeData {
  username: string
  email: string
  firstName: string
  lastName: string
  phone: string
  company: string
  department: string
  role: string
}

export interface MeetingData {
  title: string
  description: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  location: string
  clientId: string
  organizer: string
  otherAttendees?: string
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
}

export interface ImportResult {
  success: number
  errors: number
  total: number
  errorDetails: string[]
}

export class CSVProcessor {
  static parseCSV(csvContent: string): string[][] {
    const lines = csvContent.split('\n').filter(line => line.trim())
    return lines.map(line => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      
      result.push(current.trim())
      return result
    })
  }

  static validateAttendeeData(data: string[][]): { valid: AttendeeData[], errors: string[] } {
    const valid: AttendeeData[] = []
    const errors: string[] = []
    
    // Expected headers: username,email,firstName,lastName,phone,company,department,role
    const expectedHeaders = ['username', 'email', 'firstName', 'lastName', 'phone', 'company', 'department', 'role']
    
    if (data.length === 0) {
      errors.push('File is empty')
      return { valid, errors }
    }

    const headers = data[0].map(h => h.toLowerCase().trim())
    
    // Validate headers
    const missingHeaders = expectedHeaders.filter(expected => 
      !headers.includes(expected.toLowerCase())
    )
    
    if (missingHeaders.length > 0) {
      errors.push(`Missing required headers: ${missingHeaders.join(', ')}`)
      return { valid, errors }
    }

    // Process data rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      const rowErrors: string[] = []
      
      if (row.length !== expectedHeaders.length) {
        rowErrors.push(`Row ${i + 1}: Incorrect number of columns`)
        continue
      }

      const attendee: Partial<AttendeeData> = {}
      
      // Map data to object
      headers.forEach((header, index) => {
        const value = row[index]?.trim()
        
        switch (header) {
          case 'username':
            if (!value) rowErrors.push(`Row ${i + 1}: Username is required`)
            attendee.username = value
            break
          case 'email':
            if (!value) rowErrors.push(`Row ${i + 1}: Email is required`)
            else if (!this.isValidEmail(value)) rowErrors.push(`Row ${i + 1}: Invalid email format`)
            attendee.email = value
            break
          case 'firstname':
            if (!value) rowErrors.push(`Row ${i + 1}: First name is required`)
            attendee.firstName = value
            break
          case 'lastname':
            if (!value) rowErrors.push(`Row ${i + 1}: Last name is required`)
            attendee.lastName = value
            break
          case 'phone':
            attendee.phone = value || ''
            break
          case 'company':
            attendee.company = value || ''
            break
          case 'department':
            attendee.department = value || ''
            break
          case 'role':
            attendee.role = value || ''
            break
        }
      })

      if (rowErrors.length === 0) {
        valid.push(attendee as AttendeeData)
      } else {
        errors.push(...rowErrors)
      }
    }

    return { valid, errors }
  }

  static validateMeetingData(data: string[][]): { valid: MeetingData[], errors: string[] } {
    const valid: MeetingData[] = []
    const errors: string[] = []
    
    // Expected headers: title,description,startDate,endDate,startTime,endTime,location,clientId,organizer,otherAttendees,status
    const expectedHeaders = ['title', 'description', 'startDate', 'endDate', 'startTime', 'endTime', 'location', 'clientId', 'organizer', 'otherattendees', 'status']
    
    if (data.length === 0) {
      errors.push('File is empty')
      return { valid, errors }
    }

    const headers = data[0].map(h => h.toLowerCase().trim())
    
    // Validate headers
    const missingHeaders = expectedHeaders.filter(expected => 
      !headers.includes(expected.toLowerCase())
    )
    
    if (missingHeaders.length > 0) {
      errors.push(`Missing required headers: ${missingHeaders.join(', ')}`)
      return { valid, errors }
    }

    // Process data rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      const rowErrors: string[] = []
      
      if (row.length !== expectedHeaders.length) {
        rowErrors.push(`Row ${i + 1}: Incorrect number of columns`)
        continue
      }

      const meeting: Partial<MeetingData> = {}
      
      // Map data to object
      headers.forEach((header, index) => {
        const value = row[index]?.trim()
        
        switch (header) {
          case 'title':
            if (!value) rowErrors.push(`Row ${i + 1}: Title is required`)
            meeting.title = value
            break
          case 'description':
            if (!value) rowErrors.push(`Row ${i + 1}: Description is required`)
            meeting.description = value
            break
          case 'startdate':
            if (!value) rowErrors.push(`Row ${i + 1}: Start date is required`)
            else if (!this.isValidDate(value)) rowErrors.push(`Row ${i + 1}: Invalid start date format (YYYY-MM-DD)`)
            meeting.startDate = value
            break
          case 'enddate':
            if (!value) rowErrors.push(`Row ${i + 1}: End date is required`)
            else if (!this.isValidDate(value)) rowErrors.push(`Row ${i + 1}: Invalid end date format (YYYY-MM-DD)`)
            meeting.endDate = value
            break
          case 'starttime':
            if (!value) rowErrors.push(`Row ${i + 1}: Start time is required`)
            else if (!this.isValidTime(value)) rowErrors.push(`Row ${i + 1}: Invalid start time format (HH:MM)`)
            meeting.startTime = value
            break
          case 'endtime':
            if (!value) rowErrors.push(`Row ${i + 1}: End time is required`)
            else if (!this.isValidTime(value)) rowErrors.push(`Row ${i + 1}: Invalid end time format (HH:MM)`)
            meeting.endTime = value
            break
          case 'location':
            if (!value) rowErrors.push(`Row ${i + 1}: Location is required`)
            meeting.location = value
            break
          case 'clientid':
            if (!value) rowErrors.push(`Row ${i + 1}: Client ID is required`)
            meeting.clientId = value
            break
          case 'organizer':
            if (!value) rowErrors.push(`Row ${i + 1}: Organizer is required`)
            meeting.organizer = value
            break
          case 'otherattendees':
            meeting.otherAttendees = value || ''
            break
          case 'status':
            if (!value) rowErrors.push(`Row ${i + 1}: Status is required`)
            else if (!['scheduled', 'in-progress', 'completed', 'cancelled'].includes(value.toLowerCase())) {
              rowErrors.push(`Row ${i + 1}: Invalid status. Must be one of: scheduled, in-progress, completed, cancelled`)
            }
            meeting.status = value.toLowerCase() as MeetingData['status']
            break
        }
      })

      if (rowErrors.length === 0) {
        valid.push(meeting as MeetingData)
      } else {
        errors.push(...rowErrors)
      }
    }

    return { valid, errors }
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) return false
    
    const parsedDate = new Date(date)
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime())
  }

  static isValidTime(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRegex.test(time)
  }

  static async processFile(file: File, type: 'attendees' | 'meetings'): Promise<ImportResult> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const csvContent = e.target?.result as string
          const data = this.parseCSV(csvContent)
          
          let validationResult: { valid: any[], errors: string[] }
          
          if (type === 'attendees') {
            validationResult = this.validateAttendeeData(data)
          } else {
            validationResult = this.validateMeetingData(data)
          }
          
          resolve({
            success: validationResult.valid.length,
            errors: validationResult.errors.length,
            total: data.length - 1, // Subtract header row
            errorDetails: validationResult.errors
          })
        } catch (error) {
          resolve({
            success: 0,
            errors: 1,
            total: 0,
            errorDetails: [`Failed to parse CSV file: ${error}`]
          })
        }
      }
      
      reader.onerror = () => {
        resolve({
          success: 0,
          errors: 1,
          total: 0,
          errorDetails: ['Failed to read file']
        })
      }
      
      reader.readAsText(file)
    })
  }
}
