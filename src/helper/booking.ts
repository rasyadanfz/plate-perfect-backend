
import { IAppointment } from "@dgreasi/react-native-time-slot-picker";

export function extractStartAndEndTime(appointmentTime:IAppointment) {
    const [startTimeStr, endTimeStr] = appointmentTime.appointmentTime.split(" - ");
    
    // Parsing into Date objects for more flexibility:
    const startTime = new Date(`${appointmentTime.appointmentDate}T${startTimeStr}`); // Dummy date for time parsing
    const endTime = new Date(`${appointmentTime.appointmentDate}T${endTimeStr}`);
  
    return {
      startTime,
      endTime
    };
  }
  