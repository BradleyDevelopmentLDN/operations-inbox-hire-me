import {type Enquiry, type Category, type Priority, type Owner, type Status, msHour} from "./domain.js";
// All names, organisations and contacts are intentionally fictional (.example domain reserved).
type Seed=[string,string,string,Category,Priority,Owner,Status,number,number,string?];
const seeds:Seed[]=[
 ["Priya Shah","Repair visit confirmation","Could you confirm the technician arrival window for Thursday?","Booking","Normal","Alex Morgan","New",-30,18,""],
 ["Oliver Kent","Urgent delivery issue","Our delivery has failed twice and the site opens tomorrow. Please help urgently.","Service","Urgent","Unassigned","New",-16,-5,""],
 ["Harriet Cole","Invoice mismatch","The latest invoice includes an additional £48 charge. Can you check?","Billing","High","Sam Taylor","In progress",-50,-2,"Awaiting finance approval."],
 ["Daniel Brooks","Reschedule appointment","Please move our Friday appointment to the following Tuesday.","Booking","Normal","Alex Morgan","Waiting",-19,12,"Customer to confirm suitable slot."],
 ["Amelia Frost","Damaged item complaint","The parcel arrived damaged and I am disappointed. Requesting a refund.","Complaint","High","Jordan Lee","In progress",-37,-10,"Photos received."],
 ["Noah Ellis","Wholesale partnership","We are interested in a possible wholesale partnership for our venues.","Partnership","Low","Unassigned","New",-28,70,""],
 ["Charlotte Vale","Payment receipt","Could you send a VAT receipt for our payment?","Billing","Normal","Sam Taylor","Resolved",-90,-40,"Sent receipt."],
 ["Ethan Price","New service enquiry","Would you provide a quote for annual maintenance at two locations?","Service","Normal","Unassigned","New",-5,43,""],
 ["Maya Wright","Booking cancellation","I need to cancel my reservation scheduled for next Monday.","Booking","High","Alex Morgan","In progress",-22,3,""],
 ["Isaac Stone","Website information","Are you open on bank holidays and do you provide weekend support?","General","Normal","Jordan Lee","Resolved",-84,-20,"Response sent."],
 ["Sophia Reed","Unsafe fitting complaint","The replacement fitting feels unsafe and needs an urgent check.","Complaint","Urgent","Unassigned","New",-10,-6,"Escalation needed."],
 ["Leo Barnes","Delivery date change","Is it possible to adjust our delivery date to the 27th?","Service","Normal","Sam Taylor","Waiting",-34,-1,"Waiting on courier."],
 ["Ella Gibson","Duplicate charge","I think I was charged twice on the same day. Please advise.","Billing","High","Unassigned","New",-8,16,""],
 ["Freddie Moore","Service review","Thank you for resolving last week's installation issue.","General","Low","Jordan Lee","Resolved",-140,-80,"Feedback acknowledged."],
 ["Ruby Collins","Corporate booking","Can your team accommodate a group booking for 12 people?","Booking","Normal","Alex Morgan","New",-4,20,""],
 ["Adam Parker","Product collaboration","We would love to discuss a joint event or product collaboration.","Partnership","Low","Unassigned","Waiting",-65,35,"Requested brief."],
 ["Grace Hill","Incorrect appointment details","Our confirmation lists the wrong address and we need it fixed today.","Booking","High","Unassigned","New",-20,-1,""],
 ["Oscar Reed","Replacement part status","Where is the replacement part for our maintenance request?","Service","Normal","Sam Taylor","In progress",-44,7,"Supplier chased."],
];
export function makeSample(now=Date.now()):Enquiry[] {
  return seeds.map((s,index)=>{const [customer,subject,message,category,priority,owner,status,receivedH,dueH,notes=""]=s;
    return {id:`ENQ-${String(1042+index).padStart(4,"0")}`,customer,email:`${customer.toLowerCase().replaceAll(" ",".")}@example.com`,subject,message,category:category as Category,priority:priority as Priority,owner:owner as Owner,status:status as Status,receivedAt:new Date(now+receivedH*msHour).toISOString(),dueAt:new Date(now+dueH*msHour).toISOString(),notes,resolvedAt:status==="Resolved"?new Date(now+(receivedH+8)*msHour).toISOString():null};});
}
