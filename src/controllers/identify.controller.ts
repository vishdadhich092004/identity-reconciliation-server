import { Request, Response } from "express";
import { findingMatchingContacts, createNewPrimaryContact, createNewSecondaryContact, convertPrimaryToSecondaryContact, convertToResponseFormat, findSecondaryContactsByPrimaryId, resolvePrimaryAncestor, cascadeRelinkPrimaryCluster } from "../services/identify.services";


export const identify = async (req: Request, res: Response) => {
    const { email, phoneNumber } = req.body; 

    // find contacts matching email/phone
    const matchingContacts = await findingMatchingContacts(email,phoneNumber);
    
    // no match -> create primary
    if(matchingContacts.length === 0){
        const newContact = await createNewPrimaryContact(email,phoneNumber);
        return res.status(200).json(convertToResponseFormat(newContact,[]));
    }
    
    // case 1: single match -> resolve to primary ancestor
    if(matchingContacts.length === 1){
        const match = matchingContacts[0];
        const primaryAncestor = match.linkPrecedence === "primary" ? match : await resolvePrimaryAncestor(match.id);

        // exact payload match
        if(primaryAncestor.email === email && primaryAncestor.phoneNumber === phoneNumber){
            const secondaryContacts  = await findSecondaryContactsByPrimaryId(primaryAncestor.id);
            return res.status(200).json(convertToResponseFormat(primaryAncestor,secondaryContacts));
        }
        // else: create secondary under true primary
        const newSecondaryContact = await createNewSecondaryContact(email,phoneNumber,primaryAncestor.id);
        return res.status(200).json(convertToResponseFormat(primaryAncestor,[newSecondaryContact] ));
    }

    // case 2: multiple matches, so we need to merge clusters under oldest primary
    if(matchingContacts.length >= 2){
        // resolve each to its primary
        const primaryAncestors = await Promise.all(matchingContacts.map(async (c) => {
            return c.linkPrecedence === "primary" ? c : await resolvePrimaryAncestor(c.id);
        }));

        // map helps us to de-duplicate primaries
        const uniquePrimariesMap = new Map(primaryAncestors.map(p => [p.id, p]));
        const uniquePrimaries = Array.from(uniquePrimariesMap.values());        
        // sort helps us to pick the oldest primary
        uniquePrimaries.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const truePrimary = uniquePrimaries[0];
        const otherPrimaries = uniquePrimaries.slice(1);

        // cascade: move children + demote newer primary
        await Promise.all(otherPrimaries.map(async (p) => cascadeRelinkPrimaryCluster(p.id, truePrimary.id)));

        // also patch secondaries not pointing to true primary
        const nonPrimaryMatches = matchingContacts.filter(c => c.linkPrecedence === "secondary" && c.linkedId !== truePrimary.id);
        await Promise.all(nonPrimaryMatches.map(c => convertPrimaryToSecondaryContact(c.id, truePrimary.id)));

        // check if payload email/phone combination doesn't exist in any contact
        const payloadExists = matchingContacts.some(c => c.email === email && c.phoneNumber === phoneNumber);
        
        // create new secondary if payload combination is new
        if (!payloadExists) {
            await createNewSecondaryContact(email, phoneNumber, truePrimary.id);
        }

        const updatedSecondaries = await findSecondaryContactsByPrimaryId(truePrimary.id);
        return res.status(200).json(convertToResponseFormat(truePrimary, updatedSecondaries));
    }
};
