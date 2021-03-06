<template>
    <div class="accordion-container">
        <div class="accordion accordion-flush" id="accordionFlushExample">
            <div class="accordion-item" v-for="(cat, i) in categories">
                <h2 class="accordion-header" :id="{ i }">
                    <button
                        class="accordion-button collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#flush-collapseOne"
                        aria-expanded="false"
                        aria-controls="flush-collapseOne"
                        @click="categoryClick(cat.id)"
                        :class="{ opened: category_id === cat.id }"
                    >{{ cat.name }}</button>
                </h2>
                <div
                    id="flush-collapseOne"
                    class="accordion-collapse collapse"
                    aria-labelledby="flush-headingOne"
                    data-bs-parent="#accordionFlushExample"
                    :class="{ show: category_id === cat.id }"
                >
                    <div class="row accordion-body">
                        <div
                            class="item-type"
                            v-for="(item, j) in filteredTypeItem(cat.id)"
                            @click="typeItemClick(item.id)"
                            :class="{ selected: typeitem_id === item.id && category_id === cat.id }"
                        >
                            <img
                                v-if="item.draw1 == null"
                                class="item-no-picto"
                                src="/images/nopicto.svg"
                            />
                            <item-picto
                                v-else
                                class="item-picto"
                                :class="{ selectedpicto: typeitem_id === item.id && category_id === cat.id }"
                                :pictoname="item.draw1"
                                face="front"
                            ></item-picto>
                            {{ item.name }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="row buttons">
        <div class="col-10 text-align-right">
            <button class="btn btn-link btn-previous" @click="back">Previous</button>
        </div>
        <div class="col-2 text-align-right">
            <button class="btn btn-next text-white" id="btn-next" :disabled="!valid" @click="save">Next</button>
        </div>
    </div>
</template>
<script>
import { ref, onMounted, watch } from 'vue';
import ItemPicto from '../miscellaneous/ItemPicto.vue';

export default {
    name: "DetailingItemType",
    components: { ItemPicto },
    props: {
        categories: {},
        typeitems: {},
        detailingitem: {}
    },
    emits: ['save-type-item', 'back-previous-step'],
    setup(props, context) {
        const category_id = ref(0);
        const typeitem_id = ref(0);
        const valid = ref(false);
        category_id.value = props.detailingitem.category_id != null ? props.detailingitem.category_id : 0;
        typeitem_id.value = props.detailingitem.typeitem_id != null ? props.detailingitem.typeitem_id : 0;
        valid.value = category_id.value != 0 && typeitem_id.value != 0;
        watch(() => props.detailingitem, (current_val, previous_val) => {
            category_id.value = current_val.category_id != null ? current_val.category_id : 0;
            typeitem_id.value = current_val.typeitem_id != null ? current_val.typeitem_id : 0;
        });
        watch(() => [category_id.value, typeitem_id.value], ([current_category, current_typeitem], [previous_category, previous_typeitem]) => {
            valid.value = current_category != 0 && current_typeitem != 0;
        });

        function filteredTypeItem(cat_id) {
            return props.typeitems.filter(item => item.category_id == cat_id);
        }
        function categoryClick(id) {
            category_id.value = id;
        }
        function typeItemClick(id) {
            typeitem_id.value = id;
            context.emit("save-type-item", { detailingitem_id: props.detailingitem.id, category_id: category_id.value, typeitem_id: typeitem_id.value });
            this.scrollToNext();
        }
        function save() {
            context.emit("save-type-item", { detailingitem_id: props.detailingitem.id, step: 3,typeitem_id:typeitem_id.value});
        }
        function back() {
            context.emit("back-previous-step", 1);
        }
        function  scrollToNext() {
            let element = document.getElementById("btn-next");
            let top = element.offsetTop;
            window.scrollTo(0, top);
        }
        return {
            category_id,
            typeitem_id,
            valid,
            filteredTypeItem,
            categoryClick,
            typeItemClick,
            save,
            back,
            scrollToNext
        };
    },
}
</script>
<style scoped>
.accordion-button {
    background: #ffffff;
    box-sizing: border-box;
    border-radius: 6px;
    font-family: Gotham Rounded;
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    line-height: 19.6px;
    color: #000000;
    height: 40px;
}
.accordion-item {
    margin: 10px;
    border-radius: 6px;
    border: none;
}
.accordion-flush .accordion-item .accordion-button {
    border-radius: 6px !important;
}
.accordion-body {
    background: #f8f8f8;
}
.item-type {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 8px;
    margin: 15px;
    width: 130px;
    height: 121px;
    background: #ffffff;
    box-shadow: 0px 0px 4px rgba(80, 80, 80, 0.2);
    border-radius: 4px;
}
.item-type:hover {
    background-color: #47454b;
    color: #ffffff;
}
.item-type.selected {
    background-color: #47454b;
    color: #ffffff;
}
.item-no-picto {
    padding: 15px;
}
.item-picto {
    pointer-events: fill;
    width: 65px;
    padding-bottom: 15px;
}
.item-type:hover > .item-picto {
    filter: brightness(0) invert(1);
}
.selectedpicto {
    filter: brightness(0) invert(1);
}
.accordion-button.opened {
    background: rgba(217, 237, 210, 0.2);
}
.accordion-flush .accordion-collapse {
    background: #f8f8f8;
    border-radius: 6px;
}
.accordion-button:focus,
.accordion-button:active {
    outline: none !important;
    box-shadow: none !important;
}
.opened:after {
    transform: rotate(180deg);
}
.accordion-header {
    margin: 0px !important;
}
.buttons {
    padding: 10px 60px;
}
.btn-next {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 18px 14px;
    width: 148px;
    height: 41px;
    border-radius: 4px;
    background: #42a71e;
    outline: none !important;
    box-shadow: none !important;
}
.btn-next:disabled {
    background: #e0e0e0;
}
.btn-previous {
    font-size: 16px;
    line-height: 19px;
    align-items: center;
    text-align: center;
    text-decoration-line: underline;
}
</style>
