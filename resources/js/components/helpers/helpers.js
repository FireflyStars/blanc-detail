

export const hasRoles=roles=>{
    const ses_roles=JSON.parse(window.atob(window.sessionStorage.getItem('roles')));

    let foundroles=Array();
    roles.forEach(role=> {
            let foundrole = ses_roles.filter(ses_role => ses_role.name == role);
            if(foundrole.length>0)
            foundroles.push(
                foundrole
            )
        }
    );

    return foundroles.length>0;
};

export const formatPrice=price=>`£${price !== 0 ? price.toFixed(2) : 0}`;

/**
    blanc date format helper
    @param String date_str Date in the format for Y-m-d
    @param String format default DD/MM (ex 27/09), DAY DD/MM (ex MON 27/09)
**/
export const formatDate=(date_str,format)=>{
    if(typeof format==="undefined")
        format='DD/MM';
    const date=new Date(date_str);
    let options = {  month: 'numeric', day: 'numeric' };
    if(format==='DAY DD/MM')
        options = { weekday: 'short',  month: 'numeric', day: 'numeric' };

    const dateTimeFormat = new Intl.DateTimeFormat('en-GB', options);
    return dateTimeFormat.format(date).replace(',','').toUpperCase();
}