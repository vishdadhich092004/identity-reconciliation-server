import { Contact } from "@prisma/client";
import prisma from "../db/prisma.client";


// find contacts with matching email/phone, oldest first
export const findingMatchingContacts = async (email?: string, phoneNumber?: string) => {
    const contacts = await prisma.contact.findMany({
        where: {
            OR:[{email:email},{phoneNumber:phoneNumber}]
        },
        orderBy: {
            createdAt: "asc",
        },
    });
    return contacts;
    };


// create a new primary contact
export const createNewPrimaryContact = async (email: string, phoneNumber: string) => {
    const newContact = await prisma.contact.create({
        data: {
            email: email,
            phoneNumber: phoneNumber,
        },
        include: {
            linked: true,
            secondaries: true,
        },
    });
    return newContact;
}

// create a new secondary under given primary
export const createNewSecondaryContact = async(email:string, phoneNumber:string, linkedId:number)=>{
    const newContact = await prisma.contact.create({
        data:{
            email:email,
            phoneNumber:phoneNumber,
            linkPrecedence:"secondary",
            linkedId:linkedId,
        },include:{
            linked:true,
            secondaries:true
        }
    })
    return newContact;
}

// convert contact to secondary under given primary
export const convertPrimaryToSecondaryContact = async(secondaryContactId:number, primaryContactId:number)=>{
    const updatedSecondaryContact = await prisma.contact.update({
        where:{id:secondaryContactId},
        data:{
            linkPrecedence:"secondary",
            linkedId:primaryContactId
        },include:{
            linked:true,
            secondaries:true
        }
    })
    return updatedSecondaryContact;
}

// resolve true primary by traversing linkedId
export const resolvePrimaryAncestor = async (contactId: number) => {
    let current = await prisma.contact.findUnique({ where: { id: contactId } });
    while (current && current.linkPrecedence === "secondary" && current.linkedId) {
        current = await prisma.contact.findUnique({ where: { id: current.linkedId } });
    }
    return current!;
}

// cascade: demote newer primary and re-link all its secondaries to true primary
export const cascadeRelinkPrimaryCluster = async (fromPrimaryId: number, toPrimaryId: number) => {
    await prisma.$transaction(async (tx) => {
        // Re-link all children
        await tx.contact.updateMany({
            where: { linkedId: fromPrimaryId },
            data: { linkedId: toPrimaryId },
        });
        // Convert the primary itself to secondary
        await tx.contact.update({
            where: { id: fromPrimaryId },
            data: { linkPrecedence: "secondary", linkedId: toPrimaryId },
        });
    });
}

// build response with de-duped emails/phones
export const convertToResponseFormat = (primaryContact:Contact, secondaryContacts:Contact[])=>{
    const emails = [...new Set([primaryContact.email, ...secondaryContacts.map(c => c.email)].filter(Boolean))];
    const phoneNumbers = [...new Set([primaryContact.phoneNumber, ...secondaryContacts.map(c => c.phoneNumber)].filter(Boolean))];
    const secondaryContactIds = secondaryContacts.map((secondary)=>secondary.id);
    return {
        contact:{
            primaryContactId:primaryContact.id,
            emails,
            phoneNumbers,
            secondaryContactIds
        }
    }
}

// fetch all secondaries under a primary
export const findSecondaryContactsByPrimaryId = async(primaryContactId:number)=>{
    const secondaryContacts = await prisma.contact.findMany({
        where:{linkedId:primaryContactId, linkPrecedence:"secondary"},
        orderBy:{
            createdAt:"asc"
        },
        include:{
            linked:true,
            secondaries:true    
        }
    })
    return secondaryContacts;
}