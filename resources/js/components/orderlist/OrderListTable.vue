<template>
    <div class="container-fluid position-relative p-0">
    <filters :filterDef="filterDef"></filters>
    <table class="orderlist-table" v-if="ORDER_LIST.length>0">
        <thead>
        <tr>
        <th class="tcol noselect body_small_medium"  v-for="(col,index) in tabledef" :key="index" :style="{width:col.width,'text-align':col.header_align}" :class="{'sortable': col.sortable,'check-box': col.type=='checkbox'}"  @click="sort(index,col.sortable)">{{col.name}}
            <sort-arrows v-if="col.sortable" :sort="SORTCOL" :colname="index"></sort-arrows>
            <check-box v-if="col.type=='checkbox'&&ORDER_LIST.length>0" :checked_checkbox="ORDER_LIST.length==MULTI_CHECKED.length"  @checkbox-clicked="checkboxallclicked"></check-box>
        </th>
        </tr>
        </thead>
        <transition-group tag="tbody"  name="list" appear>
        <tr class="trow" v-for="order in ORDER_LIST" :key="order.id" :class="{current_sel:order.id==CURRENT_SELECTED&&route.params.order_id>0,late:order.Status=='LATE'&&order.suggestedDeliveryDate==null&&!hasRoles(['cc']),multi:MULTI_CHECKED.includes(order.id)&&order.id!=CURRENT_SELECTED}">
            <template v-for="(col,index) in tabledef" :key="index">
            <td class="tcol" :colspan="colspan(index,order)"  :style="{width:col.width}" :class="{'check-box': col.type=='checkbox',[index]:true}"  @click="selectrow(order.id,index)" v-if="hideOnLate(order.Status,index,order)">


                <check-box v-if="col.type=='checkbox'" :checked_checkbox="(order.id==CURRENT_SELECTED&&route.params.order_id>0)||MULTI_CHECKED.includes(order.id)" :id="order.id" @checkbox-clicked="checkboxclicked"></check-box>
                <tag v-else-if="col.type=='tag'&&(order.Status!='LATE')||(col.type=='tag'&&order.Status=='LATE'&&order.suggestedDeliveryDate!=null)||(col.type=='tag'&&order.Status=='LATE'&&order.suggestedDeliveryDate==null&&hasRoles(['cc']))" :name="order[index]" >
                    <span  v-if="order.Status=='LATE'&&order.suggestedDeliveryDate!=null&&index=='Status'" class="tool-tip" :data-tooltip="`New Delivery date suggested, waiting for approval`"><i class="icon-late"></i>Late</span>
                </tag>
                <express-icon v-else-if="col.type=='express'" :express_values="order[index]"></express-icon>
                <span v-else :style="col.css" v-html="preprocess(col,order[index],order)"></span>
            </td>
            </template>
            </tr>

        </transition-group>

        <tfoot>
        <tr>
        <td class="tcol" style="text-align: center" :colspan="Object.keys(tabledef).length">  <button class="btn btn-link" @click="loadMore">Show more</button></td>
        </tr>

        </tfoot>

    </table>

      <section class="nodata p-2" v-if="ORDER_LIST.length==0">
            <p v-if="!loader_running">No orders available.</p>
      </section>
        <transition name="trans-batch-actions">
        <div class=" batch-actions" v-if="MULTI_CHECKED.length>0&&CURRENT_SELECTED==''"><button class="btn btn-outline-dark disabled body_medium"  @click="featureunavailable('Batch invoice')">Batch Invoice</button><button class="btn btn-outline-dark disabled body_medium"  @click="featureunavailable('Batch payment')">Batch Payment</button><button class="btn btn-outline-dark body_medium"  @click="markaslate">Mark as late</button><button class="btn btn-outline-dark body_medium" @click="cancelorders">Cancel order(s)</button></div>
        </transition>
    </div>


</template>

<script>
    import {useRouter,useRoute} from 'vue-router'
    import {formatPrice, hasRoles} from '../helpers/helpers'
    import {ref,computed } from 'vue';
    import {useStore} from 'vuex';
    import {
        ORDERLIST_LOAD_LIST,
        ORDERLIST_MODULE,
        ORDERLIST_GET_CURRENT_SELECTED,
        ORDERLIST_SELECT_CURRENT,
        ORDERLIST_GET_ALL_ORDER_MULITCHECKED,
        ORDERLIST_MULITCHECKED,
        ORDERLIST_MULITUNCHECKED,
        LOADER_MODULE,
        DISPLAY_LOADER,
        ORDERLIST_GET_LIST,
        GET_SHOW_LOADER,
        ORDERLIST_SORT,
        ORDERLIST_GET_SORT,
        ORDERLIST_LOADERMSG,
        ORDERLIST_RESET_MULITCHECKED,
        TOASTER_MODULE,
        TOASTER_MESSAGE,
        ORDERLIST_CANCEL_ORDERS,
        ORDERLIST_LOAD_TAB,
        ORDERLIST_MARK_AS_LATE
    } from '../../store/types/types';
    import Tag from  '../miscellaneous/Tag'
    import CheckBox from '../miscellaneous/CheckBox'
    import ExpressIcon  from '../miscellaneous/ExpressIcon'
    import SortArrows from '../miscellaneous/SortArrows'
    import Filters from '../miscellaneous/Filters'
    export default {
        name: "OrderListTable",
        props:['tabledef',"tab","id"],
        components:{Filters, Tag, CheckBox, ExpressIcon, SortArrows},
        setup(props){
            const router = useRouter();
            const store=useStore();
            const route = useRoute();
            const ORDER_LIST=computed(()=>{
                return store.getters[`${ORDERLIST_MODULE}${ORDERLIST_GET_LIST}`];
            });
            const CURRENT_SELECTED=computed(()=>{
                return store.getters[`${ORDERLIST_MODULE}${ORDERLIST_GET_CURRENT_SELECTED}`];
            });
            const MULTI_CHECKED=computed(()=>{
                return store.getters[`${ORDERLIST_MODULE}${ORDERLIST_GET_ALL_ORDER_MULITCHECKED}`];
            });
            const SORTCOL=computed(()=>{
               return store.getters[`${ORDERLIST_MODULE}${ORDERLIST_GET_SORT}`];
            });
            function loadMore(){
                store.dispatch(`${ORDERLIST_MODULE}${ORDERLIST_LOADERMSG}`,'Loading more, please wait...');
                store.dispatch(`${ORDERLIST_MODULE}${ORDERLIST_LOAD_LIST}`,{showmore:1}).finally(()=>{
                     window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: "smooth" })
                });

            }

            function preprocess(def,val,order) {
                if(typeof def.type!="undefined"&&def.type=="tag"){
                    if(val=='LATE'&&order.suggestedDeliveryDate==null&&!hasRoles(['cc'])){
                        return '<span class="body_medium">This order is late, please suggest a new delivery date.</span>';
                    }
                }
                if(def.name=="Promised Date"&&!hasRoles(['cc'])&&order.Status=='LATE'&&order.suggestedDeliveryDate!=null){
                    return '<span style="color:red;">Waiting for cc approval</span>';
                }
                if(def.name=="Promised Date"&&hasRoles(['cc'])&&order.Status=='LATE'&&order.suggestedDeliveryDate!=null){
                    return '<button class="btn btn-dark body_medium">Add date</button>';
                }
                if(typeof def.type!="undefined"&&def.type=="price"){

                    return formatPrice(val);
                }
                if(def.name=="Name"||def.name=="Destination"){
                    return val.toLowerCase();
                }
                return val;
            }

            function selectrow(id,colname){
                if(colname=='line_select') return;
                store.dispatch(`${ORDERLIST_MODULE}${ORDERLIST_SELECT_CURRENT}`,id);
                  router.push({
                    name:'OrderDetails',
                    params: {
                        order_id:id,
                    },
                })
            }
            function checkboxclicked(check,id,name) {
                if(CURRENT_SELECTED.value==id&&check==false){
                    store.dispatch(`${ORDERLIST_MODULE}${ORDERLIST_SELECT_CURRENT}`,'');
                        router.back();
                }
                if(check==true){
                    store.dispatch(`${ORDERLIST_MODULE}${ORDERLIST_MULITCHECKED}`,id);
                }
                if(check==false){
                    store.dispatch(`${ORDERLIST_MODULE}${ORDERLIST_MULITUNCHECKED}`,id);
                }
            }
            function checkboxallclicked(check,id,name) {
                console.log('bangbang',check);
                    if(check==false)
                        store.dispatch(`${ORDERLIST_MODULE}${ORDERLIST_RESET_MULITCHECKED}`);

                    if(check){
                        const list=_.cloneDeep(ORDER_LIST.value);
                        list.forEach(order => store.dispatch(`${ORDERLIST_MODULE}${ORDERLIST_MULITCHECKED}`,order.id));
                        }
            }
            function sort(colname,sortable){

                if(sortable)
                    store.dispatch(`${ORDERLIST_MODULE}${ORDERLIST_SORT}`,colname);
            }

            const filterDef={
                def:{
                    'infoOrder.paid':{
                        name:"Payment status",
                        options:{
                            0:"Unpaid",
                            1:"Paid",
                        }
                    },
                    'infoOrder.Status':{
                        name:"Order status",
                        options:{
                            'ASSEMBLING':'ASSEMBLING',
                            'AWAITING REDELIVERY':'AWAITING REDELIVERY',
                            'AWAITING SALE':'AWAITING SALE',
                            'CANCELLED':'CANCELLED',
                            'CHECK IN ATELIER':'CHECK IN ATELIER',
                            'COLLECTED':'COLLECTED',
                            'DELETE':'DELETE',
                            'DELIVERED':'DELIVERED',
                            'DELIVERED TO STORE':'DELIVERED TO STORE',
                            'DELIVERY IN STORE':'DELIVERY IN STORE',
                            'DONATED TO CHARITY':'DONATED TO CHARITY',
                            'DROPPED OFF':'DROPPED OFF',
                            'FAILED DELIVERY':'FAILED DELIVERY',
                            'FAILED PAYMENT':'FAILED PAYMENT',
                            'FULFILLED':'FULFILLED',
                            'IN PROCESS':'IN PROCESS',
                            'IN STORAGE':'IN STORAGE',
                            'LATE':'LATE',
                            'LATE DELIVERY':'LATE DELIVERY',
                            'MISSED PICKUP':'MISSED PICKUP',
                            'OFFLOADED':'OFFLOADED',
                            'ON VAN':'ON VAN',
                            'OVERDUE FOR COLLECTION':'OVERDUE FOR COLLECTION',
                            'OVERDUE STORE':'OVERDUE STORE',
                            'PART ON HOLD':'PART ON HOLD',
                            'PART PENDING':'PART PENDING',
                            'PICKED UP':'PICKED UP',
                            'READY':'READY',
                            'RECURRING':'RECURRING',
                            'READY IN STORE':'READY IN STORE',
                            'SCHEDULED':'SCHEDULED',
                            'SOLD':'SOLD',
                            'VOID':'VOID',

                        }
                    },
                    'infoCustomer.TypeDelivery':{
                        name:"Destination",
                        options:{
                            'DELIVERY':'DELIVERY',
                            'CHELSEA':'CHELSEA',
                            'MARYLEBONE':'MARYLEBONE',
                            'NOTTING HILL':'NOTTING HILL',
                            'SOUTH KEN':'SOUTH KEN'
                        }

                    },
                    'infoitems.express':{
                        name: "Turnaround time",
                        options:{
                            standard:"Standard",
                            exp24:"Express 24h",
                            exp48:"Express 48h"
                        }

                    }
                }
            }
            const featureunavailable=((feature)=>{
                store.dispatch(`${TOASTER_MODULE}${TOASTER_MESSAGE}`,{message:feature+' feature not yet implemented.',ttl:5,type:'success'});
            });
            const cancelorders =(()=>{
                store.dispatch(`${ORDERLIST_MODULE}${ORDERLIST_LOADERMSG}`,`Cancelling ${MULTI_CHECKED.value.length} order(s), please wait...`);
                store.dispatch(`${ORDERLIST_MODULE}${ORDERLIST_CANCEL_ORDERS}`,MULTI_CHECKED.value).then(()=>{
                    if(ORDER_LIST.value.length==0){
                            store.dispatch(`${ORDERLIST_MODULE}${ORDERLIST_LOAD_TAB}`,{tab:props.id,name:props.tab.name});
                    }
                    store.dispatch(`${TOASTER_MODULE}${TOASTER_MESSAGE}`,{message:'Order(s) cancelled successfully.',ttl:5,type:'success'});
                    store.dispatch(`${ORDERLIST_MODULE}${ORDERLIST_RESET_MULITCHECKED}`);
                }).catch((error)=>{
                    store.dispatch(`${TOASTER_MODULE}${TOASTER_MESSAGE}`,{message:`An error has occured: ${error.response.status} ${error.response.statusText}`,ttl:5,type:'danger'});
                });

            });
            const markaslate=(()=>{
                store.dispatch(`${ORDERLIST_MODULE}${ORDERLIST_LOADERMSG}`,`Marking ${MULTI_CHECKED.value.length} order(s) as late, please wait...`);
                store.dispatch(`${ORDERLIST_MODULE}${ORDERLIST_MARK_AS_LATE}`,MULTI_CHECKED.value).then(()=>{

                    store.dispatch(`${TOASTER_MODULE}${TOASTER_MESSAGE}`,{message:'Order(s) marked as late successfully.',ttl:5,type:'success'});
                    store.dispatch(`${ORDERLIST_MODULE}${ORDERLIST_RESET_MULITCHECKED}`);
                }).catch((error)=>{
                    store.dispatch(`${TOASTER_MODULE}${TOASTER_MESSAGE}`,{message:`An error has occured: ${error.response.status} ${error.response.statusText}`,ttl:5,type:'danger'});
                });
            });
            const hideOnLate=((status,colname,order)=>{

                    if(status==='LATE'&&order.suggestedDeliveryDate==null&&(colname=='numitems'||colname=='paid')&&!hasRoles(['cc']))
                    return false;

                    return true;
            });

            const colspan=(colname,order)=>{
                if(order.Status=='LATE'&&order.suggestedDeliveryDate==null&&colname=='Status'&&!hasRoles(['cc']))
                    return 3
                return 1;
            }

            return {
                route,
                CURRENT_SELECTED,
                MULTI_CHECKED,
                ORDER_LIST,
                loadMore,
                preprocess,
                selectrow,
                checkboxclicked,
                loader_running:computed(()=>{return (store.getters[`${LOADER_MODULE}${GET_SHOW_LOADER}`]);}),
                sort,
                SORTCOL,
                filterDef,
                checkboxallclicked,
                featureunavailable,
                cancelorders,
                hideOnLate,
                markaslate,
                hasRoles,
                colspan
            }
        }
    }
</script>

<style scoped>

    .container-fluid{
        padding-left: 0;
    }
    @media only screen and (max-width: 1089px) {
        .container-fluid{
            padding-left: 10px;
            padding-right: 10px;
        }
    }
    .current_sel{
        position: relative;
        z-index:10000;
        background: rgb(247, 251, 246);
        box-shadow: inset 0px -1px 0px rgba(168, 168, 168, 0.25);
    }
    /*list transitions*/
    .list-enter-from{
        opacity: 0;
        transform: scale(0.6);
    }
    .list-enter-to{
        opacity: 1;
        transform: scale(1);
    }
    .list-enter-active{
        transition: all 1s ease;
    }

    .list-leave-from{
        opacity: 1;
        transform: scale(1);
    }
    .list-leave-to{
        opacity: 0;
        transform: scale(0.6);
    }
    .list-leave-active{
        transition: all 1s ease;
        position: absolute;
        width: 100%;
    }
    .list-move{
        transition:all 0.9s ease;
    }
    .check-box{
        padding:20px 22px
    }
    .nodata{
        background: #FFFFFF;
        min-height: 550px;
        display: flex;
        align-items: center;justify-content: center;
    }
    .batch-actions{
        background: #EEEEEE;
        box-shadow: inset 0px -1px 0px rgba(168, 168, 168, 0.25);
        padding: 1rem 0;
        position: sticky;
        bottom: 0;
        transform-origin: bottom center;
        z-index: 1;
    }
    .batch-actions button{
        margin-left: 1rem;

    }

    .trans-batch-actions-enter-from{
        opacity: 0;
        transform: scale(0.6);
    }
    .trans-batch-actions-enter-to{
        opacity: 1;
        transform: scale(1);
    }
    .trans-batch-actions-enter-active{
        transition: all ease 0.2s;
    }
    .trans-batch-actions-leave-from{
        opacity: 1;
        transform: scale(1);
    }
    .trans-batch-actions-leave-to{
        opacity: 0;
        transform: scale(0.6);
    }
    .trans-batch-actions-leave-active{
        transition: all ease 0.2s;
    }
.tcol.Status,.tcol.paid{
    text-align: center;
}
</style>